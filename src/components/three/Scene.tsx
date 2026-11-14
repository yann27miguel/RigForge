import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitImpl } from 'three-stdlib'
import { displayName } from '../../data/parts'
import type { ResolvedBuild } from '../../data/types'
import { useT } from '../../i18n'
import { useSettings } from '../../store/settings'
import { CoolerModel, CpuModel, GpuModel, M2Model, MotherboardModel, RamModel } from './boardModels'
import { CaseFans, CaseShell, DriveModels, PsuModel } from './caseModels'
import { computeLayout, mm, type Layout, type V3 } from './layout'
import { ledMaterial, rgbMaterial } from './materials'
import { Ghost, PartGroup } from './PartGroup'

export type ViewName = 'iso' | 'front' | 'side' | 'top'

export const captureRef: { current: null | (() => string) } = { current: null }

function RgbDriver() {
  const { rgbColor, rgbMode } = useSettings()
  const base = useMemo(() => new THREE.Color(rgbColor), [rgbColor])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (rgbMode === 'off') {
      rgbMaterial.emissiveIntensity = 0
      rgbMaterial.color.set('#15171b')
      return
    }
    rgbMaterial.color.set('#000000')
    if (rgbMode === 'rainbow') {
      rgbMaterial.emissive.setHSL((t * 0.08) % 1, 0.95, 0.55)
      rgbMaterial.emissiveIntensity = 2.4
    } else {
      rgbMaterial.emissive.copy(base)
      rgbMaterial.emissiveIntensity = rgbMode === 'breathe' ? 0.5 + (Math.sin(t * 2) * 0.5 + 0.5) * 2.4 : 2.4
    }
    ledMaterial.emissive.set('#e6f6ff')
  })
  return null
}

function CameraRig({ L, view }: { L: Layout; view: { name: ViewName; n: number } }) {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: OrbitImpl | null }
  const anim = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; t: number } | null>(null)
  useEffect(() => {
    const dist = Math.max(L.D, L.H, L.W * 2) * 2.7
    const cy = L.H / 2
    const pos: Record<ViewName, V3> = {
      iso: [-dist * 0.5, cy + dist * 0.32, dist * 0.82],
      front: [-dist, cy + dist * 0.05, mm(1)],
      side: [mm(1), cy + dist * 0.04, dist],
      top: [mm(1), cy + dist, mm(40)],
    }
    anim.current = { pos: new THREE.Vector3(...pos[view.name]), target: new THREE.Vector3(0, cy, 0), t: 0 }
  }, [view.name, view.n, L.D, L.H, L.W])
  useFrame((_, dt) => {
    const a = anim.current
    if (!a || !controls) return
    a.t += dt
    const k = 1 - Math.exp(-dt * 5)
    camera.position.lerp(a.pos, k)
    controls.target.lerp(a.target, k)
    controls.update()
    if (a.t > 1.6) anim.current = null
  })
  return null
}

function Capture() {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    captureRef.current = () => {
      gl.render(scene, camera)
      return gl.domElement.toDataURL('image/png')
    }
    return () => {
      captureRef.current = null
    }
  }, [gl, scene, camera])
  return null
}

function Rig({ r, interactive }: { r: ResolvedBuild; interactive: boolean }) {
  const { t } = useT()
  const L = useMemo(() => computeLayout(r), [r])
  const ghosts = interactive && !!r.case
  const lbl = (c: Parameters<typeof t>[0]) => t(`cat.${c}`)
  return (
    <group>
      <PartGroup cat="case" label={lbl('case')} sub={r.case ? displayName(r.case) : undefined} explodeDir={[0, 0, 0]} partKey={r.case?.id} interactive={interactive && !!r.case}>
        <CaseShell L={L} pcCase={r.case} />
      </PartGroup>

      {r.motherboard ? (
        <PartGroup cat="motherboard" label={lbl('motherboard')} sub={displayName(r.motherboard)} explodeDir={[0, 0, 0.2]} partKey={r.motherboard.id + L.ff} interactive={interactive}>
          <MotherboardModel L={L} mb={r.motherboard} />
        </PartGroup>
      ) : ghosts ? (
        <Ghost cat="motherboard" label={lbl('motherboard')} size={[L.mb.w, L.mb.h, mm(10)]} position={[L.mb.backX - L.mb.w / 2, L.mb.topY - L.mb.h / 2, L.mb.surface]} />
      ) : null}

      {r.cpu ? (
        <PartGroup cat="cpu" label={lbl('cpu')} sub={displayName(r.cpu)} explodeDir={[0, 0, 0.5]} partKey={r.cpu.id + L.ff} interactive={interactive}>
          <CpuModel L={L} cpu={r.cpu} />
        </PartGroup>
      ) : ghosts ? (
        <Ghost cat="cpu" label={lbl('cpu')} size={[mm(50), mm(50), mm(12)]} position={[L.socket[0], L.socket[1], L.socket[2] + mm(8)]} />
      ) : null}

      {(r.cooler || r.cpu?.boxedCooler) && r.cpu ? (
        <PartGroup cat="cooler" label={lbl('cooler')} sub={r.cooler ? displayName(r.cooler) : t('common.stockCooler')} explodeDir={[0, 0.15, 1.05]} partKey={(r.cooler?.id ?? 'stock') + L.ff + (r.case?.id ?? '')} interactive={interactive}>
          <CoolerModel L={L} cooler={r.cooler} cpuBrand={r.cpu.brand} />
        </PartGroup>
      ) : ghosts && r.cpu ? (
        <Ghost cat="cooler" label={lbl('cooler')} size={[mm(120), mm(125), mm(140)]} position={[L.socket[0], L.socket[1], L.socket[2] + mm(80)]} />
      ) : null}

      {r.ram ? (
        <PartGroup cat="ram" label={lbl('ram')} sub={displayName(r.ram)} explodeDir={[0, 0.2, 0.75]} partKey={r.ram.id + L.ff} interactive={interactive}>
          <RamModel L={L} ram={r.ram} />
        </PartGroup>
      ) : ghosts ? (
        <Ghost cat="ram" label={lbl('ram')} size={[mm(40), mm(133), mm(34)]} position={[(L.ramSlots[0][0] + L.ramSlots[L.ramSlots.length - 1][0]) / 2, L.ramSlots[0][1], L.ramSlots[0][2] + mm(24)]} />
      ) : null}

      {r.gpu ? (
        <PartGroup cat="gpu" label={lbl('gpu')} sub={displayName(r.gpu)} explodeDir={[0, -0.3, 0.95]} partKey={r.gpu.id + L.ff + (r.case?.id ?? '')} interactive={interactive}>
          <GpuModel L={L} gpu={r.gpu} />
        </PartGroup>
      ) : ghosts ? (
        <Ghost cat="gpu" label={lbl('gpu')} size={[mm(280), mm(50), mm(120)]} position={[L.mb.backX + mm(8) - mm(140), L.pcieY - mm(15), L.mb.surface + mm(64)]} />
      ) : null}

      {r.storage.length > 0 ? (
        <PartGroup cat="storage" label={lbl('storage')} sub={r.storage.map((s) => s.name).join(' + ')} explodeDir={[0, 0, 0.6]} partKey={r.storage.map((s) => s.id).join() + L.ff + (r.case?.id ?? '')} interactive={interactive}>
          <M2Model L={L} drives={r.storage.filter((s) => s.formFactor === 'M.2')} />
          <DriveModels L={L} drives={r.storage} />
        </PartGroup>
      ) : ghosts ? (
        <Ghost cat="storage" label={lbl('storage')} size={[mm(80), mm(22), mm(8)]} position={[L.m2[0][0] - mm(40), L.m2[0][1], L.m2[0][2] + mm(6)]} />
      ) : null}

      {r.psu ? (
        <PartGroup cat="psu" label={lbl('psu')} sub={displayName(r.psu)} explodeDir={[0.3, -0.15, 0.8]} partKey={r.psu.id + (r.case?.id ?? '')} interactive={interactive}>
          <PsuModel L={L} psu={r.psu} />
        </PartGroup>
      ) : ghosts ? (
        <Ghost cat="psu" label={lbl('psu')} size={[L.psu.d, L.psu.h, L.psu.w]} position={L.psu.pos} />
      ) : null}

      {r.case && (
        <PartGroup cat="fans" label={lbl('fans')} sub={r.fans ? displayName(r.fans) : undefined} explodeDir={[-0.45, 0.25, 0.15]} partKey={(r.fans?.id ?? '') + r.case.id + (r.cooler?.id ?? '')} interactive={interactive}>
          <CaseFans L={L} fans={r.fans} pcCase={r.case} />
        </PartGroup>
      )}
      <ContactShadows position={[0, -mm(12), 0]} scale={Math.max(L.D, L.W) * 3} blur={2.4} opacity={0.55} far={2} resolution={512} color="#000000" />
    </group>
  )
}

export function Scene({ r, interactive = true, view, autoRotate }: { r: ResolvedBuild; interactive?: boolean; view?: { name: ViewName; n: number }; autoRotate?: boolean }) {
  const settingsRotate = useSettings((s) => s.autoRotate)
  const L = useMemo(() => computeLayout(r), [r])
  const v = view ?? { name: 'iso' as ViewName, n: 0 }
  const dist = Math.max(L.D, L.H, L.W * 2) * 2.7
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true, alpha: true }}
      camera={{ fov: 35, position: [-dist * 0.5, L.H / 2 + dist * 0.32, dist * 0.82], near: 0.05, far: 200 }}
      onPointerMissed={() => document.body.style.setProperty('cursor', '')}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <hemisphereLight args={['#dfe9ff', '#1a1f2b', 0.45]} />
        <directionalLight position={[-4, 9, 7]} intensity={2.6} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004}>
          <orthographicCamera attach="shadow-camera" args={[-6, 6, 6, -6, 0.5, 30]} />
        </directionalLight>
        <directionalLight position={[6, 3, -5]} intensity={0.8} color="#8ea2ff" />
        <pointLight position={[-L.D * 0.15, L.H * 0.55, L.W * 1.1]} intensity={3.2} distance={8} decay={1.5} color="#e8f6ff" />
        <pointLight position={[-L.D * 0.3, L.H * 0.3, L.W * 0.3]} intensity={1.6} distance={5} color="#9fb2ff" />
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={2} position={[0, 6, 4]} scale={[10, 4, 1]} />
          <Lightformer form="rect" intensity={1.2} color="#7c8cff" position={[-6, 2, -2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer form="ring" intensity={1.5} color="#38e8c6" position={[6, 3, 2]} rotation-y={-Math.PI / 2} scale={3} />
        </Environment>
        <Rig r={r} interactive={interactive} />
        <RgbDriver />
        <Capture />
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur luminanceThreshold={1.1} intensity={0.9} radius={0.65} />
        </EffectComposer>
      </Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={dist * 0.35} maxDistance={dist * 2} target={[0, L.H / 2, 0]} autoRotate={autoRotate ?? settingsRotate} autoRotateSpeed={0.8} maxPolarAngle={Math.PI * 0.62} />
      {view && <CameraRig L={L} view={v} />}
    </Canvas>
  )
}
