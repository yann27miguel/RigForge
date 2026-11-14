import { Bounds, Center, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import type { Category, ResolvedBuild } from '../../data/types'
import { CoolerModel, CpuModel, GpuModel, M2Model, MotherboardModel, RamModel } from './boardModels'
import { CaseShell, DriveModels, PsuModel } from './caseModels'
import { computeLayout, mm } from './layout'
import { Fan } from './primitives'
import { RgbDriver } from './Scene'

/** The selected part on its own, out of the case – auto-fitted, rotating, draggable. */
export function PartInspector({ r, cat, storageId }: { r: ResolvedBuild; cat: Category; storageId?: string }) {
  const L = useMemo(() => computeLayout(r), [r])
  const model = (() => {
    switch (cat) {
      case 'cpu': return r.cpu ? <CpuModel L={L} cpu={r.cpu} /> : null
      case 'cooler': return r.cpu && (r.cooler || r.cpu.boxedCooler) ? <CoolerModel L={L} cooler={r.cooler} cpuBrand={r.cpu.brand} /> : null
      case 'motherboard': return r.motherboard ? <MotherboardModel L={L} mb={r.motherboard} /> : null
      case 'ram': return r.ram ? <RamModel L={L} ram={r.ram} /> : null
      case 'gpu': return r.gpu ? <GpuModel L={L} gpu={r.gpu} /> : null
      case 'psu': return r.psu ? <PsuModel L={L} psu={r.psu} /> : null
      case 'case': return r.case ? <CaseShell L={L} pcCase={r.case} /> : null
      case 'storage': {
        const d = r.storage.find((s) => s.id === storageId) ?? r.storage[0]
        if (!d) return null
        return d.formFactor === 'M.2' ? <M2Model L={L} drives={[d]} /> : <DriveModels L={L} drives={[d]} />
      }
      case 'fans': return r.fans || r.case ? <Fan size={mm(r.fans?.sizeMm ?? 120)} depth={mm(25)} rgb={!!r.fans?.rgb || !!r.case?.rgb} frame={(r.fans?.color ?? r.case?.color) === 'white' ? '#f2f4f7' : '#15171c'} /> : null
    }
  })()
  if (!model) return null
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }} camera={{ fov: 32, position: [-3, 2, 5], near: 0.01, far: 100 }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[-3, 6, 5]} intensity={2.4} />
        <directionalLight position={[4, 2, -3]} intensity={0.8} color="#9fb2ff" />
        <Environment resolution={64}>
          <Lightformer form="rect" intensity={2} position={[0, 5, 4]} scale={[8, 3, 1]} />
          <Lightformer form="ring" intensity={1.2} color="#38e8c6" position={[5, 2, 2]} rotation-y={-Math.PI / 2} scale={2} />
        </Environment>
        <RgbDriver />
        <Bounds key={cat + (storageId ?? '')} fit clip observe margin={1.25}>
          <Center>{model}</Center>
        </Bounds>
      </Suspense>
      <OrbitControls makeDefault enableDamping autoRotate autoRotateSpeed={1.6} enablePan={false} />
    </Canvas>
  )
}
