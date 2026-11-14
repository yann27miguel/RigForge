import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useSettings } from '../../store/settings'
import { mat, rgbMaterial } from './materials'
import type { V3 } from './layout'

interface FanProps {
  size: number
  position?: V3
  rotation?: V3
  rgb?: boolean
  frame?: string
  blade?: string
  depth?: number
  speedMul?: number
}

/** A 120/140 mm fan: frame, hub, 7 pitched blades, optional RGB ring. Spins along local Z. */
export function Fan({ size, position, rotation, rgb, frame = '#15171c', blade = '#20232a', depth = 0.25, speedMul = 1 }: FanProps) {
  const rotor = useRef<THREE.Group>(null)
  const speed = useSettings((s) => s.fanSpeed)
  const off = useMemo(() => Math.random() * Math.PI, [])
  useFrame((_, dt) => {
    if (rotor.current) rotor.current.rotation.z -= dt * (1.5 + speed * 28) * speedMul
  })
  const half = size / 2
  const bar = size * 0.08
  const bladeGeo = useMemo(() => {
    const shape = new THREE.Shape()
    const r0 = size * 0.12
    const r1 = size * 0.46
    shape.moveTo(r0, -size * 0.05)
    shape.quadraticCurveTo(r1 * 0.7, -size * 0.12, r1, -size * 0.02)
    shape.quadraticCurveTo(r1 * 0.75, size * 0.12, r0, size * 0.07)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: depth * 0.25, bevelEnabled: false })
  }, [size, depth])
  return (
    <group position={position} rotation={rotation}>
      {/* square frame */}
      <mesh position={[0, half - bar / 2, 0]} material={mat(frame)}><boxGeometry args={[size, bar, depth]} /></mesh>
      <mesh position={[0, -half + bar / 2, 0]} material={mat(frame)}><boxGeometry args={[size, bar, depth]} /></mesh>
      <mesh position={[half - bar / 2, 0, 0]} material={mat(frame)}><boxGeometry args={[bar, size, depth]} /></mesh>
      <mesh position={[-half + bar / 2, 0, 0]} material={mat(frame)}><boxGeometry args={[bar, size, depth]} /></mesh>
      {/* round shroud */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mat(frame, { rough: 0.5 })}>
        <cylinderGeometry args={[size * 0.48, size * 0.48, depth * 0.9, 40, 1, true]} />
      </mesh>
      {rgb && (
        <mesh material={rgbMaterial} position={[0, 0, depth * 0.46]}>
          <torusGeometry args={[size * 0.47, size * 0.012, 8, 48]} />
        </mesh>
      )}
      <group ref={rotor} rotation={[0, 0, off]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mat(blade, { rough: 0.4 })}>
          <cylinderGeometry args={[size * 0.13, size * 0.13, depth * 0.6, 24]} />
        </mesh>
        {rgb && (
          <mesh material={rgbMaterial} position={[0, 0, depth * 0.31]}>
            <circleGeometry args={[size * 0.09, 24]} />
          </mesh>
        )}
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} geometry={bladeGeo} rotation={[0.28, 0, (i / 7) * Math.PI * 2]} position={[0, 0, -depth * 0.12]} material={rgb ? mat('#e9eef5', { opacity: 0.85, rough: 0.2 }) : mat(blade, { rough: 0.45 })} />
        ))}
      </group>
    </group>
  )
}

/** simple box helper with optional material */
export function Box({ size, position, material, rotation, castShadow = true }: { size: V3; position?: V3; material: THREE.Material; rotation?: V3; castShadow?: boolean }) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow={castShadow} receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  )
}
