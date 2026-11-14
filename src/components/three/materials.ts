import * as THREE from 'three'

/** One shared emissive material drives every RGB element so effects stay in sync. */
export const rgbMaterial = new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#38e8c6', emissiveIntensity: 2.2, toneMapped: false })
/** status LEDs, screens, logos – always on, independent of RGB mode */
export const ledMaterial = new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#ffffff', emissiveIntensity: 0.8, toneMapped: false })

const cache = new Map<string, THREE.Material>()

export function mat(color: string, opts: { metal?: number; rough?: number; opacity?: number } = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${opts.metal ?? 0.3}|${opts.rough ?? 0.6}|${opts.opacity ?? 1}`
  let m = cache.get(key) as THREE.MeshStandardMaterial | undefined
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      metalness: opts.metal ?? 0.3,
      roughness: opts.rough ?? 0.6,
      transparent: (opts.opacity ?? 1) < 1,
      opacity: opts.opacity ?? 1,
      depthWrite: (opts.opacity ?? 1) >= 1,
    })
    cache.set(key, m)
  }
  return m
}

let meshTex: THREE.Texture | null = null
/** procedural perforated-mesh texture (no network, no image files) */
export function meshTexture(): THREE.Texture {
  if (meshTex) return meshTex
  const s = 64
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, s, s)
  ctx.fillStyle = '#000000'
  const r = 9
  for (const [x, y] of [[16, 16], [48, 16], [0, 48], [32, 48], [64, 48]]) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  meshTex = new THREE.CanvasTexture(cv)
  meshTex.wrapS = meshTex.wrapT = THREE.RepeatWrapping
  meshTex.repeat.set(14, 14)
  return meshTex
}

const meshMats = new Map<string, THREE.MeshStandardMaterial>()
export function meshPanelMaterial(color: string, xray: boolean): THREE.MeshStandardMaterial {
  const key = color + xray
  let m = meshMats.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.5, alphaMap: meshTexture(), transparent: true, opacity: xray ? 0.15 : 0.95, alphaTest: 0.05, side: THREE.DoubleSide, depthWrite: false })
    meshMats.set(key, m)
  }
  return m
}

export const glassMaterial = new THREE.MeshStandardMaterial({
  color: '#0a1220',
  metalness: 0,
  roughness: 0.08,
  transparent: true,
  opacity: 0.16,
  envMapIntensity: 0.12,
  side: THREE.DoubleSide,
  depthWrite: false,
})
