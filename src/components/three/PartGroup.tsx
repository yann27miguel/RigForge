import { Html } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import type { Category } from '../../data/types'
import { useBuild } from '../../store/build'
import { useSettings } from '../../store/settings'
import type { V3 } from './layout'

interface Props {
  cat: Category
  label: string
  sub?: string
  explodeDir: V3
  children: ReactNode
  /** key that changes when the part changes, to re-measure bounds */
  partKey?: string
  interactive?: boolean
}

export function PartGroup({ cat, label, sub, explodeDir, children, partKey, interactive = true }: Props) {
  const outer = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const [hover, setHover] = useState(false)
  const focus = useBuild((s) => s.focus === cat)
  const setFocus = useBuild((s) => s.setFocus)
  const lastAdded = useBuild((s) => s.lastAdded)
  const explode = useSettings((s) => s.explode)
  const showLabels = useSettings((s) => s.labels)
  const intro = useRef(0)
  const lastSeen = useRef(0)
  const [bounds, setBounds] = useState<{ size: V3; center: V3 } | null>(null)

  useLayoutEffect(() => {
    if (lastAdded && lastAdded.at !== lastSeen.current && (lastAdded.cat === cat || lastAdded.cat === 'all')) {
      lastSeen.current = lastAdded.at
      if (Date.now() - lastAdded.at < 1500) intro.current = 1
    }
  }, [lastAdded, cat])

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      if (!inner.current) return
      const prev = inner.current.position.clone()
      inner.current.position.set(0, 0, 0)
      inner.current.updateWorldMatrix(true, true)
      const box = new THREE.Box3()
      inner.current.traverse((o) => {
        if ((o as THREE.Mesh).isMesh && !o.userData.noBounds) box.expandByObject(o)
      })
      inner.current.position.copy(prev)
      if (box.isEmpty()) return setBounds(null)
      const parentInv = new THREE.Matrix4().copy(outer.current!.matrixWorld).invert()
      box.applyMatrix4(parentInv)
      const s = new THREE.Vector3()
      const c = new THREE.Vector3()
      box.getSize(s)
      box.getCenter(c)
      setBounds({ size: [s.x + 0.04, s.y + 0.04, s.z + 0.04], center: [c.x, c.y, c.z] })
    })
    return () => cancelAnimationFrame(id)
  }, [partKey])

  useFrame((_, dt) => {
    if (!inner.current) return
    intro.current = THREE.MathUtils.damp(intro.current, 0, 3.2, dt)
    const k = explode * 1.6 + intro.current * 2.2
    const t = new THREE.Vector3(explodeDir[0] * k, explodeDir[1] * k, explodeDir[2] * k)
    inner.current.position.lerp(t, 1 - Math.exp(-dt * 10))
  })

  const edges = useMemo(() => (bounds ? new THREE.EdgesGeometry(new THREE.BoxGeometry(...bounds.size)) : null), [bounds])
  const active = hover || focus

  const handlers = interactive
    ? {
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        },
        onPointerOut: () => {
          setHover(false)
          document.body.style.cursor = ''
        },
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          setFocus(cat)
        },
      }
    : {}

  return (
    <group ref={outer}>
      <group ref={inner} {...handlers}>
        {children}
        {edges && bounds && active && (
          <lineSegments geometry={edges} position={bounds.center} renderOrder={10}>
            <lineBasicMaterial color={focus ? '#38e8c6' : '#a5b4fc'} transparent opacity={0.9} depthTest={false} />
          </lineSegments>
        )}
        {bounds && ((showLabels && cat !== 'case') || hover) && (
          <Html position={cat === 'case' ? [bounds.center[0], bounds.center[1] + bounds.size[1] / 2 + 0.05, bounds.center[2]] : [bounds.center[0], bounds.center[1], bounds.center[2] + bounds.size[2] / 2]} center distanceFactor={9} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <div className="whitespace-nowrap rounded-lg border border-ink/15 bg-slate-950/85 px-2.5 py-1 text-[11px] leading-tight text-white shadow-lg backdrop-blur">
              <div className="font-semibold text-teal-300">{label}</div>
              {sub && <div className="max-w-[220px] truncate text-ink2">{sub}</div>}
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}

/** pulsing placeholder for an empty slot – click opens the picker */
export function Ghost({ size, position, label, cat }: { size: V3; position: V3; label: string; cat: Category }) {
  const ref = useRef<THREE.MeshBasicMaterial>(null)
  const openPicker = useBuild((s) => s.openPicker)
  const [hover, setHover] = useState(false)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.opacity = (hover ? 0.32 : 0.1) + Math.sin(clock.elapsedTime * 3) * 0.05
  })
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)), [size])
  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          openPicker(cat)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
      >
        <boxGeometry args={size} />
        <meshBasicMaterial ref={ref} color="#38e8c6" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineDashedMaterial color="#38e8c6" transparent opacity={0.6} />
      </lineSegments>
      <Html center distanceFactor={9} zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
        <div className="whitespace-nowrap rounded-full border border-teal-300/40 bg-teal-400/15 px-2 py-0.5 text-[10px] font-semibold text-teal-200 backdrop-blur">+ {label}</div>
      </Html>
    </group>
  )
}
