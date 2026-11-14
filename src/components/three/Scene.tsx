import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitImpl } from 'three-stdlib'
import { displayName } from '../../data/parts'
import type { Category, ResolvedBuild } from '../../data/types'
import { useT } from '../../i18n'
import { useSettings, type ViewMode } from '../../store/settings'
import { CoolerModel, CpuModel, GpuModel, M2Model, MotherboardModel, RamModel } from './boardModels'
import { CaseFans, CaseShell, DriveModels, PsuModel } from './caseModels'
import { computeLayout, mm, type Layout, type V3 } from './layout'
import { ledMaterial, rgbMaterial } from './materials'
import { Ghost, PartGroup, type Bounds } from './PartGroup'

export type ViewName = 'iso' | 'front' | 'side' | 'top'

export const captureRef: { current: null | (() => string) } = { current: null }

export function RgbDriver() {
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

/** camera framing for each display mode */
export function frame(L: Layout, mode: ViewMode, bench: BenchFrame | null) {
  const base = Math.max(L.D, L.H, L.W * 2) * 2.7
  if (mode === 'bench' && bench) {
    const span = Math.max(bench.width, bench.depth)
    return { dist: Math.max(base * 1.2, span * 2.3), target: new THREE.Vector3(bench.cx, Math.min(1.2, L.H / 4), bench.cz) }
  }
  return { dist: base, target: new THREE.Vector3(0, L.H / 2, 0) }
}

export interface BenchFrame {
  cx: number
  cz: number
  width: number
  depth: number
}

function CameraRig({ L, view, mode, bench }: { L: Layout; view: { name: ViewName; n: number }; mode: ViewMode; bench: BenchFrame | null }) {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: OrbitImpl | null }
  const anim = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; t: number } | null>(null)
  const benchKey = bench ? `${bench.cx.toFixed(1)}|${bench.cz.toFixed(1)}|${bench.width.toFixed(1)}` : ''
  useEffect(() => {
    const { dist, target } = frame(L, mode, bench)
    const { x, y, z } = target
    const pos: Record<ViewName, V3> = {
      iso: mode === 'bench' ? [x + dist * 0.12, y + dist * 0.5, z + dist * 0.86] : [x - dist * 0.5, y + dist * 0.32, z + dist * 0.82],
      front: [x - dist, y + dist * 0.05, z + mm(1)],
      side: [x + mm(1), y + dist * (mode === 'bench' ? 0.25 : 0.04), z + dist],
      top: [x + mm(1), y + dist, z + mm(40)],
    }
    anim.current = { pos: new THREE.Vector3(...pos[view.name]), target, t: 0 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.name, view.n, L.D, L.H, L.W, mode, benchKey])
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

const BENCH_BACK: Category[] = ['motherboard', 'gpu', 'psu']
const BENCH_FRONT: Category[] = ['cpu', 'cooler', 'ram', 'storage']

/** Lays the parts out in two rows in front of the case: big parts behind, small parts in front. */
function benchLayout(L: Layout, bmap: Partial<Record<Category, Bounds>>) {
  const gap = 0.55
  const targets: Partial<Record<Category, V3>> = {}
  const rows = [BENCH_BACK, BENCH_FRONT].map((cats) => cats.filter((c) => bmap[c]))
  let z = L.W / 2 + 0.9
  let width = 0
  let depth = 0
  rows.forEach((cats) => {
    if (!cats.length) return
    const w = cats.reduce((s, c) => s + bmap[c]!.size[0], 0) + gap * (cats.length - 1)
    const d = Math.max(...cats.map((c) => bmap[c]!.size[2]))
    let x = -w / 2
    for (const c of cats) {
      const b = bmap[c]!
      targets[c] = [x + b.size[0] / 2, b.size[1] / 2 + 0.01, z + d / 2]
      x += b.size[0] + gap
    }
    z += d + 0.7
    width = Math.max(width, w)
    depth += d + 0.7
  })
  const cz = L.W / 2 + 0.9 + depth / 2 - 0.35
  const matW = Math.max(width, 3) + 1.2
  // the (now empty) case stays behind the work mat, like on a real build table
  const back = -L.W / 2
  const front = L.W / 2 + 0.9 + depth
  const frameInfo: BenchFrame = { cx: 0, cz: (back + front) / 2, width: Math.max(matW, L.D), depth: front - back }
  return { targets, frame: frameInfo, mat: { w: matW, d: depth + 0.6, cz } }
}

/** anti-static work mat under the laid-out parts */
function BenchMat({ w, d, cz }: { w: number; d: number; cz: number }) {
  const tex = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 64
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#2b5266'
    ctx.fillRect(0, 0, 64, 64)
    ctx.strokeStyle = 'rgba(160,220,255,0.18)'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, 63, 63)
    const t = new THREE.CanvasTexture(cv)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(w * 2, d * 2)
    return t
  }, [w, d])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, cz]} receiveShadow userData={{ noBounds: true }}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={tex} roughness={0.95} metalness={0} />
    </mesh>
  )
}

function Rig({ r, interactive, mode, onBench }: { r: ResolvedBuild; interactive: boolean; mode: ViewMode; onBench?: (f: BenchFrame | null) => void }) {
  const { t } = useT()
  const L = useMemo(() => computeLayout(r), [r])
  const ghosts = interactive && !!r.case && mode !== 'bench'
  const lbl = (c: Parameters<typeof t>[0]) => t(`cat.${c}`)
  const [bmap, setBmap] = useState<Partial<Record<Category, Bounds>>>({})
  const onBounds = useCallback((cat: Category, b: Bounds | null) => {
    setBmap((m) => {
      const next = { ...m }
      if (b) next[cat] = b
      else delete next[cat]
      return next
    })
  }, [])
  // forget bounds of parts that were removed
  const present = (['motherboard', 'gpu', 'psu', 'cpu', 'cooler', 'ram', 'storage'] as Category[]).filter((c) => (c === 'storage' ? r.storage.length : c === 'cooler' ? r.cooler || r.cpu?.boxedCooler : r[c as 'cpu']))
  const bench = useMemo(() => {
    const live: Partial<Record<Category, Bounds>> = {}
    for (const c of present) if (bmap[c]) live[c] = bmap[c]
    return benchLayout(L, live)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bmap, L, present.join()])
  useEffect(() => onBench?.(mode === 'bench' ? bench.frame : null), [bench, mode, onBench])
  const caseKey = '|' + (r.case?.id ?? '')
  const pg = (c: Category) => ({ mode, benchTarget: bench.targets[c] ?? null, onBounds })
  return (
    <group>
      {mode !== 'open' && (
        <PartGroup cat="case" label={lbl('case')} sub={r.case ? displayName(r.case) : undefined} explodeDir={[0, 0, 0]} partKey={r.case?.id} interactive={interactive && !!r.case} mode={mode}>
          <CaseShell L={L} pcCase={r.case} />
        </PartGroup>
      )}
      {mode === 'bench' && present.length > 0 && (
        <>
          <BenchMat w={bench.mat.w} d={bench.mat.d} cz={bench.mat.cz} />
          {/* workbench lamp */}
          <pointLight position={[bench.frame.cx, 4.5, bench.mat.cz + 1.5]} intensity={9} distance={16} decay={1.4} color="#f4f8ff" />
        </>
      )}

      {r.motherboard ? (
        <PartGroup cat="motherboard" label={lbl('motherboard')} sub={displayName(r.motherboard)} explodeDir={[0, 0, 0.2]} partKey={r.motherboard.id + L.ff + caseKey} {...pg('motherboard')} interactive={interactive}>
          <MotherboardModel L={L} mb={r.motherboard} />
        </PartGroup>
      ) : ghosts ? (
        <Ghost cat="motherboard" label={lbl('motherboard')} size={[L.mb.w, L.mb.h, mm(10)]} position={[L.mb.backX - L.mb.w / 2, L.mb.topY - L.mb.h / 2, L.mb.surface]} />
      ) : null}

      {r.cpu ? (
        <PartGroup cat="cpu" label={lbl('cpu')} sub={displayName(r.cpu)} explodeDir={[0, 0, 0.5]} partKey={r.cpu.id + L.ff + caseKey} {...pg('cpu')} interactive={interactive}>
          <CpuModel L={L} cpu={r.cpu} />
        </PartGroup>
      ) : ghosts ? (
        <Ghost cat="cpu" label={lbl('cpu')} size={[mm(50), mm(50), mm(12)]} position={[L.socket[0], L.socket[1], L.socket[2] + mm(8)]} />
      ) : null}

      {(r.cooler || r.cpu?.boxedCooler) && r.cpu ? (
        <PartGroup cat="cooler" label={lbl('cooler')} sub={r.cooler ? displayName(r.cooler) : t('common.stockCooler')} explodeDir={[0, 0.15, 1.05]} partKey={(r.cooler?.id ?? 'stock') + L.ff + (r.case?.id ?? '') + caseKey} {...pg('cooler')} interactive={interactive}>
          <CoolerModel L={L} cooler={r.cooler} cpuBrand={r.cpu.brand} />
        </PartGroup>
      ) : ghosts && r.cpu ? (
        <Ghost cat="cooler" label={lbl('cooler')} size={[mm(120), mm(125), mm(140)]} position={[L.socket[0], L.socket[1], L.socket[2] + mm(80)]} />
      ) : null}

      {r.ram ? (
        <PartGroup cat="ram" label={lbl('ram')} sub={displayName(r.ram)} explodeDir={[0, 0.2, 0.75]} partKey={r.ram.id + L.ff + caseKey} {...pg('ram')} interactive={interactive}>
          <RamModel L={L} ram={r.ram} />
        </PartGroup>
      ) : ghosts ? (
        <Ghost cat="ram" label={lbl('ram')} size={[mm(40), mm(133), mm(34)]} position={[(L.ramSlots[0][0] + L.ramSlots[L.ramSlots.length - 1][0]) / 2, L.ramSlots[0][1], L.ramSlots[0][2] + mm(24)]} />
      ) : null}

      {r.gpu ? (
        <PartGroup cat="gpu" label={lbl('gpu')} sub={displayName(r.gpu)} explodeDir={[0, -0.3, 0.95]} partKey={r.gpu.id + L.ff + (r.case?.id ?? '') + caseKey} {...pg('gpu')} interactive={interactive}>
          <GpuModel L={L} gpu={r.gpu} />
        </PartGroup>
      ) : ghosts ? (
        <Ghost cat="gpu" label={lbl('gpu')} size={[mm(280), mm(50), mm(120)]} position={[L.mb.backX + mm(8) - mm(140), L.pcieY - mm(15), L.mb.surface + mm(64)]} />
      ) : null}

      {r.storage.length > 0 ? (
        <PartGroup cat="storage" label={lbl('storage')} sub={r.storage.map((s) => s.name).join(' + ')} explodeDir={[0, 0, 0.6]} partKey={r.storage.map((s) => s.id).join() + L.ff + caseKey} {...pg('storage')} interactive={interactive}>
          <M2Model L={L} drives={r.storage.filter((s) => s.formFactor === 'M.2')} />
          <DriveModels L={L} drives={r.storage} />
        </PartGroup>
      ) : ghosts ? (
        <Ghost cat="storage" label={lbl('storage')} size={[mm(80), mm(22), mm(8)]} position={[L.m2[0][0] - mm(40), L.m2[0][1], L.m2[0][2] + mm(6)]} />
      ) : null}

      {r.psu ? (
        <PartGroup cat="psu" label={lbl('psu')} sub={displayName(r.psu)} explodeDir={[0.3, -0.15, 0.8]} partKey={r.psu.id + (r.case?.id ?? '') + caseKey} {...pg('psu')} interactive={interactive}>
          <PsuModel L={L} psu={r.psu} />
        </PartGroup>
      ) : ghosts ? (
        <Ghost cat="psu" label={lbl('psu')} size={[L.psu.d, L.psu.h, L.psu.w]} position={L.psu.pos} />
      ) : null}

      {r.case && (
        <PartGroup cat="fans" mode={mode} label={lbl('fans')} sub={r.fans ? displayName(r.fans) : undefined} explodeDir={[-0.45, 0.25, 0.15]} partKey={(r.fans?.id ?? '') + r.case.id + (r.cooler?.id ?? '')} interactive={interactive}>
          <CaseFans L={L} fans={r.fans} pcCase={r.case} />
        </PartGroup>
      )}
      <ContactShadows position={mode === 'bench' ? [bench.frame.cx, -mm(12), bench.frame.cz] : [0, -mm(12), 0]} scale={mode === 'bench' ? bench.frame.width * 1.3 + 4 : Math.max(L.D, L.W) * 3} blur={2.4} opacity={0.55} far={3} resolution={512} color="#000000" />
    </group>
  )
}

export function Scene({ r, interactive = true, view, autoRotate }: { r: ResolvedBuild; interactive?: boolean; view?: { name: ViewName; n: number }; autoRotate?: boolean }) {
  const settingsRotate = useSettings((s) => s.autoRotate)
  const settingsMode = useSettings((s) => s.viewMode)
  const mode: ViewMode = interactive ? settingsMode : 'installed'
  const [bench, setBench] = useState<BenchFrame | null>(null)
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
          <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.5, 40]} />
        </directionalLight>
        <directionalLight position={[6, 3, -5]} intensity={0.8} color="#8ea2ff" />
        <pointLight position={[-L.D * 0.15, L.H * 0.55, L.W * 1.1]} intensity={3.2} distance={8} decay={1.5} color="#e8f6ff" />
        <pointLight position={[-L.D * 0.3, L.H * 0.3, L.W * 0.3]} intensity={1.6} distance={5} color="#9fb2ff" />
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={2} position={[0, 6, 4]} scale={[10, 4, 1]} />
          <Lightformer form="rect" intensity={1.2} color="#7c8cff" position={[-6, 2, -2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer form="ring" intensity={1.5} color="#38e8c6" position={[6, 3, 2]} rotation-y={-Math.PI / 2} scale={3} />
        </Environment>
        <Rig r={r} interactive={interactive} mode={mode} onBench={setBench} />
        <RgbDriver />
        <Capture />
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur luminanceThreshold={1.1} intensity={0.9} radius={0.65} />
        </EffectComposer>
      </Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={dist * 0.12} maxDistance={dist * 3.2} target={[0, L.H / 2, 0]} autoRotate={autoRotate ?? settingsRotate} autoRotateSpeed={0.8} maxPolarAngle={Math.PI * 0.62} />
      {view && <CameraRig L={L} view={v} mode={mode} bench={bench} />}
    </Canvas>
  )
}
