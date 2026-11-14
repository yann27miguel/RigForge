// Sanity check: every preset must be error-free, and the build assistant must produce valid builds.
// Run with: npm run check
import { PRESETS } from '../src/data/presets'
import { resolve, totalPrice } from '../src/lib/build'
import { checkBuild } from '../src/lib/compat'
import { estimatePower } from '../src/lib/power'
import { balance, scores } from '../src/lib/perf'
import { recommend } from '../src/lib/wizard'
for (const p of PRESETS) {
  const r = resolve(p.build)
  const c = checkBuild(r)
  const pw = estimatePower(r)
  console.log(p.id.padEnd(14), String(totalPrice(r)).padStart(5), 'E', c.errors, 'W', c.warnings, 'complete', c.complete, 'pw', Math.round(pw.total), pw.recommended, 'bal', balance(r,'1440p')?.verdict, JSON.stringify(scores(r)), c.issues.filter(i=>i.level!=='info').map(i=>i.key).join(','))
}
for (const uc of ['esports','gaming1440','gaming4k','streaming','creator','office','ai'] as const) for (const budget of [800, 1200, 1800, 2500, 4000]) {
  const res = recommend({ budget, useCase: uc, platform: 'any', color: 'any', size: 'any', wifi: false, rgb: false })
  if (!res || !res.total) { console.log(uc, budget, 'NONE min', res?.minBudget); continue }
  const r = resolve(res.build); const c = checkBuild(r)
  console.log(uc.padEnd(11), budget, '->', res.total, 'E', c.errors, 'W', c.warnings, r.cpu?.name, '|', r.gpu?.chip ?? 'iGPU', '|', r.ram?.capacityGB+'GB', '|', r.case?.name, '|', r.psu?.wattage, '|', r.cooler?.name ?? 'stock')
}
for (const opt of [{color:'white'},{size:'sff'},{platform:'intel'},{rgb:true,wifi:true}] as const) {
  const res = recommend({ budget: 2200, useCase: 'gaming1440', platform: 'any', color: 'any', size: 'any', wifi: false, rgb: false, ...opt } as any)
  const r = resolve(res!.build); const c = checkBuild(r)
  console.log(JSON.stringify(opt), res!.total, 'E', c.errors, 'W', c.warnings, r.cpu?.name, r.gpu?.name, r.case?.name, r.motherboard?.name, r.cooler?.name, r.fans?.name)
}
const bad = PRESETS.filter((p) => checkBuild(resolve(p.build)).errors > 0)
if (bad.length) {
  console.error('Presets with errors:', bad.map((b) => b.id))
  process.exit(1)
}
console.log('\nAll presets are compatible ✓')
