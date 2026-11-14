/**
 * RigForge specs fetcher – Cloudflare Worker (free tier is enough).
 *
 *   GET https://<your-worker>.workers.dev/?url=<product page URL>
 *   → { url, title, price, currency, text }
 *
 * The browser cannot read other websites (CORS), so this worker fetches a product page
 * server-side, extracts the title, price (JSON-LD / meta tags) and readable text, and
 * returns it to RigForge, which then detects the parts with its own parser.
 *
 * Safety: only HTTPS pages on the shop/manufacturer allowlist are fetched, responses are
 * capped in size, and only your site's origin may call the worker (set ALLOWED_ORIGIN).
 */

const ALLOWED_HOSTS = [
  'geizhals.de', 'geizhals.at', 'geizhals.eu', 'idealo.de', 'idealo.fr',
  'amazon.de', 'amazon.fr', 'amazon.com', 'amazon.co.uk',
  'alternate.de', 'mindfactory.de', 'caseking.de', 'notebooksbilliger.de', 'cyberport.de',
  'mediamarkt.de', 'saturn.de', 'otto.de', 'galaxus.de', 'proshop.de', 'computeruniverse.net',
  'ldlc.com', 'materiel.net', 'topachat.com', 'cdiscount.com', 'fnac.com',
  'memorypc.de', 'one.de', 'agando.de', 'dubaro.de', 'mifcom.de', 'hardwareschotte.de', 'csl-computer.com',
  'nzxt.com', 'dell.com', 'hp.com', 'lenovo.com', 'acer.com', 'msi.com', 'asus.com', 'corsair.com', 'alienware.com',
  'pcpartpicker.com', 'dropreference.com', 'pangoly.com', 'pc-kombo.com', 'buildcores.com',
]

const MAX_BYTES = 2_500_000
const MAX_TEXT = 60_000

function hostAllowed(host) {
  host = host.toLowerCase()
  return ALLOWED_HOSTS.some((h) => host === h || host.endsWith('.' + h))
}

function cors(origin, env) {
  const allowed = env.ALLOWED_ORIGIN || '*'
  const ok = allowed === '*' || allowed.split(',').map((s) => s.trim()).includes(origin)
  return {
    'Access-Control-Allow-Origin': ok ? (allowed === '*' ? '*' : origin) : 'null',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600', ...headers } })
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&euro;/g, '€')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function extract(html) {
  const title = decodeEntities((html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i) || html.match(/<title[^>]*>([^<]+)/i) || [])[1] || '').trim()
  let price, currency
  // JSON-LD Product → offers.price
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1].trim())
      const items = Array.isArray(data) ? data : data['@graph'] || [data]
      for (const it of items) {
        if (!it || !/product/i.test(String(it['@type']))) continue
        const offers = Array.isArray(it.offers) ? it.offers[0] : it.offers
        const p = offers && (offers.price ?? offers.lowPrice)
        if (p) {
          price = Number(String(p).replace(',', '.'))
          currency = offers.priceCurrency
          break
        }
      }
    } catch {
      /* ignore invalid JSON-LD */
    }
    if (price) break
  }
  if (!price) {
    const meta = html.match(/<meta[^>]+(?:property|itemprop)=["'](?:product:price:amount|price)["'][^>]+content=["']([\d.,]+)/i)
    if (meta) price = Number(meta[1].replace(/\.(?=\d{3})/g, '').replace(',', '.'))
  }
  const text = decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<(br|\/p|\/li|\/tr|\/h\d|\/div)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
    .slice(0, MAX_TEXT)
  return { title, price: Number.isFinite(price) ? price : undefined, currency, text }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const headers = cors(origin, env)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    if (request.method !== 'GET') return json({ error: 'method' }, 405, headers)
    if (headers['Access-Control-Allow-Origin'] === 'null') return json({ error: 'origin' }, 403, headers)

    const target = new URL(request.url).searchParams.get('url') || ''
    let url
    try {
      url = new URL(target)
    } catch {
      return json({ error: 'invalid_url' }, 400, headers)
    }
    if (url.protocol !== 'https:' || !hostAllowed(url.hostname)) return json({ error: 'host_not_allowed', allowed: ALLOWED_HOSTS }, 400, headers)

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 RigForgeSpecs/1.0',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8,fr;q=0.7',
      },
      redirect: 'follow',
      cf: { cacheTtl: 3600, cacheEverything: true },
    }).catch(() => null)
    if (!res) return json({ error: 'fetch_failed' }, 502, headers)
    if (!res.ok) return json({ error: 'upstream_' + res.status }, 502, headers)
    const finalUrl = res.url || url.toString()
    const finalHost = new URL(finalUrl).hostname
    if (!hostAllowed(finalHost)) return json({ error: 'host_not_allowed' }, 400, headers)

    const reader = res.body.getReader()
    const chunks = []
    let size = 0
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      size += value.byteLength
    }
    reader.cancel().catch(() => {})
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const c of chunks) {
      bytes.set(c.subarray(0, Math.min(c.byteLength, size - offset)), offset)
      offset += c.byteLength
    }
    const html = new TextDecoder('utf-8').decode(bytes)
    return json({ url: finalUrl, ...extract(html) }, 200, headers)
  },
}
