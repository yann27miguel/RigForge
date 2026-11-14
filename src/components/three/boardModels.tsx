import { RoundedBox } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { Cooler, CPU, GPU, Motherboard, RAM, Storage } from '../../data/types'
import { BRAND_COLOR } from '../../data/style'
import { ledMaterial, mat, rgbMaterial } from './materials'
import { Box, Fan } from './primitives'
import { mm, type Layout, type V3 } from './layout'

const PCB = '#2a313b'
const PCB_WHITE = '#c9d1da'

/* --------------------------------------------------------------- motherboard */
export function MotherboardModel({ L, mb }: { L: Layout; mb?: Motherboard }) {
  const white = mb?.color === 'white'
  const pcb = mat(white ? PCB_WHITE : PCB, { rough: 0.7, metal: 0.1 })
  const sink = mat(white ? '#eef2f6' : '#6b7480', { metal: 0.85, rough: 0.32 })
  const accent = mat(white ? '#b9c3cf' : '#8c96a3', { metal: 0.9, rough: 0.3 })
  const slot = mat('#0d0f12', { rough: 0.5 })
  const { w, h, backX, topY, z } = L.mb
  const cx = backX - w / 2
  const cy = topY - h / 2
  const at = (u: number, v: number, du: number, dv: number, dz: number, extraZ = 0): { position: V3; size: V3 } => ({
    position: [backX - mm(u + du / 2), topY - mm(v + dv / 2), L.mb.surface + mm(dz / 2 + extraZ)],
    size: [mm(du), mm(dv), mm(dz)],
  })
  const itx = L.ff === 'ITX'
  const io = at(0, 0, 32, itx ? 125 : 155, 26)
  const vrmTop = at(itx ? 36 : 44, 6, itx ? 90 : 110, 22, 22)
  const vrmSide = at(itx ? 34 : 38, 28, 22, itx ? 70 : 105, 24)
  const chipset = at(itx ? 110 : 150, itx ? 118 : 215, itx ? 40 : 55, itx ? 30 : 42, 10)
  const atx24 = at((itx ? 170 : 244) - 14, itx ? 20 : 95, 8, 52, 12)
  return (
    <group>
      <Box size={[w, h, mm(1.6)]} position={[cx, cy, z + mm(8)]} material={pcb} />
      {/* PCB traces shimmer */}
      <mesh position={[cx, cy, z + mm(8.9)]} material={mat(white ? '#d7dee6' : '#313945', { rough: 0.35, metal: 0.4 })}>
        <planeGeometry args={[w * 0.96, h * 0.96]} />
      </mesh>
      <Box {...io} material={sink} />
      <Box {...vrmTop} material={sink} />
      <Box {...vrmSide} material={sink} />
      {/* VRM fins */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Box key={i} size={[mm(itx ? 90 : 110), mm(1.5), mm(4)]} position={[vrmTop.position[0], vrmTop.position[1] - mm(9) + mm(i * 3.5), vrmTop.position[2] + mm(12)]} material={accent} castShadow={false} />
      ))}
      {!itx && <Box {...chipset} material={sink} />}
      {/* brand accent on chipset / I/O cover (MSI red, Gigabyte orange …) */}
      {mb && <Box size={[(itx ? vrmTop.size[0] : chipset.size[0]) * 0.8, mm(3), mm(1.2)]} position={itx ? [vrmTop.position[0], vrmTop.position[1] - mm(6), vrmTop.position[2] + mm(12)] : [chipset.position[0], chipset.position[1], chipset.position[2] + mm(5.6)]} material={mat(BRAND_COLOR[mb.brand] ?? '#94a3b8', { metal: 0.4, rough: 0.35 })} castShadow={false} />}
      {/* rgb accent on I/O cover */}
      <Box size={[mm(2), io.size[1] * 0.6, mm(2)]} position={[io.position[0] - io.size[0] / 2, io.position[1], io.position[2] + io.size[2] / 2]} material={rgbMaterial} castShadow={false} />
      <Box {...atx24} material={slot} />
      {/* RAM slots */}
      {L.ramSlots.map((p, i) => (
        <Box key={i} size={[mm(5), mm(140), mm(7)]} position={[p[0], p[1], p[2] + mm(3.5)]} material={mat(white ? '#9aa6b4' : '#2a2f37')} castShadow={false} />
      ))}
      {/* PCIe x16 slot with metal reinforcement */}
      <Box size={[mm(89), mm(7), mm(9)]} position={[backX - mm(50 + 44), L.pcieY, L.mb.surface + mm(4.5)]} material={mat('#9aa3ad', { metal: 0.9, rough: 0.25 })} castShadow={false} />
      {!itx && <Box size={[mm(89), mm(6), mm(7)]} position={[backX - mm(50 + 44), L.pcieY - mm(L.ff === 'mATX' ? 60 : 82), L.mb.surface + mm(3.5)]} material={slot} castShadow={false} />}
      {/* M.2 heatsink covers (when no SSD is installed they still exist on board) */}
      {L.m2.slice(1).map((p, i) => (
        <Box key={i} size={[mm(80), mm(22), mm(5)]} position={[p[0] - mm(40), p[1], p[2] + mm(2.5)]} material={sink} castShadow={false} />
      ))}
      {/* socket frame */}
      <Box size={[L.socketSize + mm(16), L.socketSize + mm(16), mm(4)]} position={[L.socket[0], L.socket[1], L.socket[2] + mm(2)]} material={mat('#8f99a5', { metal: 0.9, rough: 0.3 })} castShadow={false} />
      {/* debug LEDs */}
      <Box size={[mm(3), mm(10), mm(1)]} position={[backX - mm(itx ? 160 : 230), topY - mm(60), L.mb.surface + mm(1)]} material={ledMaterial} castShadow={false} />
    </group>
  )
}

/* --------------------------------------------------------------- CPU */
export function CpuModel({ L, cpu }: { L: Layout; cpu: CPU }) {
  const s = L.socketSize
  return (
    <group position={L.socket}>
      <Box size={[s, s, mm(3)]} position={[0, 0, mm(5.5)]} material={mat('#2c6e49', { rough: 0.6 })} />
      <RoundedBox args={[s * 0.82, s * 0.82, mm(4)]} radius={mm(1.2)} position={[0, 0, mm(9)]} material={mat('#c4ccd4', { metal: 1, rough: 0.22 })} castShadow />
      <mesh position={[0, 0, mm(11.05)]} material={mat(cpu.brand === 'AMD' ? '#1f2937' : '#1e3a8a', { opacity: 0.35 })}>
        <planeGeometry args={[s * 0.5, s * 0.2]} />
      </mesh>
    </group>
  )
}

/* --------------------------------------------------------------- CPU cooler */
export function CoolerModel({ L, cooler, cpuBrand }: { L: Layout; cooler?: Cooler; cpuBrand?: string }) {
  const base = L.socket
  if (!cooler) {
    // boxed stock cooler
    return (
      <group position={base}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, mm(30)]} material={mat('#3b4048', { metal: 0.85, rough: 0.35 })} castShadow>
          <cylinderGeometry args={[mm(42), mm(42), mm(36), 28]} />
        </mesh>
        <Fan size={mm(88)} position={[0, 0, mm(54)]} depth={mm(14)} frame={cpuBrand === 'AMD' ? '#1f1f1f' : '#24324d'} />
      </group>
    )
  }
  if (cooler.type === 'aio') {
    const white = cooler.color === 'white'
    const shell = mat(white ? '#f1f4f8' : '#16181d', { rough: 0.35, metal: 0.4 })
    const R = L.radiator
    const pump: V3 = [base[0], base[1], base[2] + mm(28)]
    const tubes = R
      ? [0, 1].map((i) => {
          const endX = R.pos[0] + R.len / 2 - mm(20)
          const start = new THREE.Vector3(pump[0] + mm(i ? 14 : -14), pump[1] + mm(26), pump[2] + mm(12))
          const end = new THREE.Vector3(endX - mm(i * 24), R.pos[1] - mm(10), R.pos[2] + mm(i ? 20 : -20))
          const mid = new THREE.Vector3((start.x + end.x) / 2 + mm(40), start.y + (end.y - start.y) * 0.6, start.z + mm(60))
          return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([start, mid, end]), 40, mm(6), 10, false)
        })
      : []
    const fanCount = Math.round((cooler.radiatorMm ?? 240) / (cooler.radiatorMm === 280 ? 140 : 120))
    const fanSize = cooler.radiatorMm === 280 ? mm(140) : mm(120)
    return (
      <group>
        {/* pump block */}
        <group position={pump}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={shell} castShadow>
            <cylinderGeometry args={[mm(32), mm(34), mm(40), 40]} />
          </mesh>
          {cooler.lcd ? (
            <mesh position={[0, 0, mm(20.5)]} material={ledMaterial}>
              <circleGeometry args={[mm(27), 40]} />
            </mesh>
          ) : (
            <mesh position={[0, 0, mm(20.5)]} material={mat('#0b0d10', { rough: 0.2, metal: 0.6 })}>
              <circleGeometry args={[mm(27), 40]} />
            </mesh>
          )}
          {(cooler.rgb || cooler.lcd) && (
            <mesh position={[0, 0, mm(20.6)]} material={rgbMaterial}>
              <torusGeometry args={[mm(29.5), mm(1.6), 8, 40]} />
            </mesh>
          )}
        </group>
        {tubes.map((g, i) => (
          <mesh key={i} geometry={g} material={mat(white ? '#e5e9ef' : '#111316', { rough: 0.7 })} castShadow />
        ))}
        {R && (
          <group position={R.pos}>
            <Box size={[R.len, mm(27), mm(122)]} material={mat(white ? '#e8ecf1' : '#1b1e23', { metal: 0.25, rough: 0.6 })} />
            {/* fins */}
            <mesh position={[0, -mm(13.6), 0]} rotation={[Math.PI / 2, 0, 0]} material={mat(white ? '#cfd6de' : '#2b3038', { metal: 0.8, rough: 0.4 })}>
              <planeGeometry args={[R.len - mm(36), mm(118)]} />
            </mesh>
            {Array.from({ length: fanCount }).map((_, i) => (
              <Fan key={i} size={fanSize} depth={mm(25)} rgb={cooler.rgb} frame={white ? '#f3f5f8' : '#15171c'} blade={white ? '#f3f5f8' : '#20232a'}
                position={[-(fanCount - 1) * (fanSize + mm(2)) / 2 + i * (fanSize + mm(2)), -mm(27), 0]} rotation={[Math.PI / 2, 0, 0]} />
            ))}
          </group>
        )}
      </group>
    )
  }
  // air coolers
  const height = mm(cooler.heightMm ?? 150)
  const fin = mat(cooler.brand === 'Noctua' ? '#c9ccd1' : '#2a2e35', { metal: 0.9, rough: 0.3 })
  const fanFrame = cooler.brand === 'Noctua' ? '#6b4f3a' : '#16181d'
  const fanBlade = cooler.brand === 'Noctua' ? '#c79a7e' : '#1f2228'
  if ((cooler.heightMm ?? 150) < 100) {
    // low-profile: heatsink parallel to the board, fan on top
    return (
      <group position={base}>
        <Box size={[mm(110), mm(110), mm(cooler.heightMm! - 30)]} position={[0, 0, mm((cooler.heightMm! - 30) / 2 + 6)]} material={fin} />
        <Fan size={mm(120)} depth={mm(15)} position={[0, 0, mm(cooler.heightMm! - 10)]} frame={fanFrame} blade={fanBlade} />
      </group>
    )
  }
  const dual = (cooler.heightMm ?? 0) >= 155 && cooler.tdpRating >= 240
  const stackT = mm(dual ? 32 : 50)
  const stacks = dual ? [-mm(30), mm(30)] : [0]
  const finCount = dual ? 14 : 20
  return (
    <group position={base}>
      <Box size={[mm(40), mm(40), mm(10)]} position={[0, 0, mm(9)]} material={mat('#b87333', { metal: 1, rough: 0.3 })} />
      {/* heat pipes */}
      {[-12, -4, 4, 12].map((y) => (
        <mesh key={y} position={[0, mm(y), mm(12) + (height - mm(20)) / 2]} rotation={[Math.PI / 2, 0, 0]} material={mat('#c27a3d', { metal: 1, rough: 0.25 })}>
          <cylinderGeometry args={[mm(3), mm(3), height - mm(20), 10]} />
        </mesh>
      ))}
      {stacks.map((x) => (
        <group key={x} position={[x, 0, mm(30) + (height - mm(30)) / 2]}>
          {Array.from({ length: finCount }).map((_, i) => (
            <Box key={i} size={[stackT, mm(125), mm(0.8)]} position={[0, 0, -(height - mm(36)) / 2 + (i / (finCount - 1)) * (height - mm(36))]} material={fin} castShadow={i % 4 === 0} />
          ))}
          <Box size={[stackT, mm(125), mm(4)]} position={[0, 0, (height - mm(30)) / 2 - mm(2)]} material={mat(cooler.brand === 'Noctua' ? '#e6e7ea' : '#121418', { metal: 0.6, rough: 0.4 })} />
        </group>
      ))}
      {/* front fan (and center fan for dual towers) */}
      <Fan size={mm(120)} depth={mm(25)} position={[-(dual ? mm(60) : mm(40)), 0, mm(30) + (height - mm(30)) / 2]} rotation={[0, Math.PI / 2, 0]} frame={fanFrame} blade={fanBlade} rgb={cooler.rgb} />
      {dual && <Fan size={mm(120)} depth={mm(25)} position={[0, 0, mm(30) + (height - mm(30)) / 2]} rotation={[0, Math.PI / 2, 0]} frame={fanFrame} blade={fanBlade} />}
    </group>
  )
}

/* --------------------------------------------------------------- RAM */
export function RamModel({ L, ram }: { L: Layout; ram: RAM }) {
  const n = Math.min(ram.modules, L.ramSlots.length)
  const idx = L.ramSlots.length === 4 && n === 2 ? [1, 3] : Array.from({ length: n }, (_, i) => i)
  const height = mm(ram.rgb ? 44 : 34)
  const white = ram.color === 'white'
  const spreader = mat(white ? '#eef1f5' : ram.brand === 'Kingston' ? '#22252b' : '#2b2f36', { metal: 0.7, rough: 0.35 })
  return (
    <group>
      {idx.map((i) => {
        const p = L.ramSlots[i]
        return (
          <group key={i} position={[p[0], p[1], p[2] + mm(7)]}>
            <Box size={[mm(6.5), mm(133), height]} position={[0, 0, height / 2]} material={spreader} />
            <Box size={[mm(1), mm(120), height * 0.55]} position={[mm(3.3), 0, height * 0.45]} material={mat(white ? '#c9d0d9' : '#4a525d', { metal: 0.9, rough: 0.2 })} castShadow={false} />
            {ram.rgb && <Box size={[mm(5), mm(128), mm(7)]} position={[0, 0, height + mm(2)]} material={rgbMaterial} castShadow={false} />}
            {/* gold contacts peeking out of the slot */}
            <Box size={[mm(6.8), mm(126), mm(2)]} position={[0, 0, mm(1)]} material={mat('#d4af37', { metal: 1, rough: 0.25 })} castShadow={false} />
            <Box size={[mm(6.8), mm(30), mm(4)]} position={[0, mm(40), height * 0.6]} material={mat(BRAND_COLOR[ram.brand] ?? '#94a3b8', { metal: 0.5, rough: 0.35 })} castShadow={false} />
          </group>
        )
      })}
    </group>
  )
}

/* --------------------------------------------------------------- GPU */
export function GpuModel({ L, gpu }: { L: Layout; gpu: GPU }) {
  const len = mm(gpu.lengthMm)
  const thick = mm(gpu.slots * 20)
  const cardH = mm(gpu.lengthMm > 300 ? 137 : 120)
  const white = gpu.color === 'white'
  const shroudColor = white ? '#f1f4f8' : gpu.maker === 'AMD' && gpu.brand === 'Sapphire' ? '#20242b' : gpu.maker === 'NVIDIA' ? '#1a1c20' : '#24282f'
  const shroud = mat(shroudColor, { metal: 0.25, rough: 0.6 })
  const back = mat(white ? '#e4e8ee' : '#2f343c', { metal: 0.85, rough: 0.3 })
  const fans = gpu.lengthMm >= 270 ? 3 : gpu.lengthMm < 170 ? 1 : 2
  const fanSize = Math.min(cardH * 0.82, (len - mm(16)) / fans - mm(4))
  const x0 = L.mb.backX + mm(8) - len / 2 // bracket flush with the rear
  const yTop = L.pcieY + mm(10)
  const zc = L.mb.surface + cardH / 2 + mm(2)
  const accent = useMemo(() => (gpu.maker === 'NVIDIA' ? '#76b900' : gpu.maker === 'AMD' ? '#ed1c24' : '#0071c5'), [gpu.maker])
  return (
    <group position={[x0, yTop - thick / 2, zc]}>
      <RoundedBox args={[len, thick, cardH]} radius={mm(4)} smoothness={3} material={shroud} castShadow receiveShadow />
      {/* backplate */}
      <Box size={[len - mm(4), mm(2), cardH - mm(4)]} position={[0, thick / 2 + mm(1), 0]} material={back} />
      {/* fans on the bottom */}
      {Array.from({ length: fans }).map((_, i) => (
        <Fan key={i} size={fanSize} depth={mm(12)} frame={shroudColor} blade={white ? '#dfe4ea' : '#16181c'} rgb={gpu.rgb}
          position={[-((fans - 1) * (fanSize + mm(4))) / 2 + i * (fanSize + mm(4)), -thick / 2 - mm(2), 0]} rotation={[Math.PI / 2, 0, 0]} />
      ))}
      {/* glass-side edge: logo bar + accent */}
      <Box size={[len * 0.32, mm(4), mm(1)]} position={[-len * 0.12, mm(4), cardH / 2 + mm(0.6)]} material={gpu.rgb ? rgbMaterial : mat(white ? '#9aa4b1' : '#d6dde6', { metal: 0.9, rough: 0.2 })} castShadow={false} />
      {/* board-partner brand plate */}
      <Box size={[len * 0.14, mm(6), mm(1)]} position={[len * 0.22, mm(4), cardH / 2 + mm(0.6)]} material={mat(BRAND_COLOR[gpu.brand] ?? '#94a3b8', { metal: 0.5, rough: 0.3 })} castShadow={false} />
      <Box size={[len * 0.9, mm(1.5), mm(1)]} position={[0, -thick / 2 + mm(6), cardH / 2 + mm(0.5)]} material={mat(accent, { rough: 0.4, metal: 0.5, opacity: 0.8 })} castShadow={false} />
      {/* PCIe bracket */}
      <Box size={[mm(2), thick + mm(6), mm(120)]} position={[len / 2 - mm(1), 0, -cardH / 2 + mm(60)]} material={mat('#aab2bb', { metal: 1, rough: 0.25 })} />
      {/* power connector */}
      <Box size={[mm(gpu.power === '2x8-pin' ? 38 : gpu.power === '3x8-pin' ? 56 : 20), mm(10), mm(8)]} position={[-len * 0.05, thick / 2 + mm(6), cardH / 2 - mm(12)]} material={mat('#0c0d10')} castShadow={false} />
    </group>
  )
}

/* --------------------------------------------------------------- M.2 SSDs */
export function M2Model({ L, drives }: { L: Layout; drives: Storage[] }) {
  return (
    <group>
      {drives.slice(0, L.m2.length).map((d, i) => {
        const p = L.m2[i]
        const gen5 = d.kind === 'NVMe Gen5'
        return (
          <group key={d.id + i} position={[p[0] - mm(40), p[1], p[2]]}>
            <Box size={[mm(80), mm(22), mm(1.2)]} position={[0, 0, mm(2)]} material={mat('#0f3d2e', { rough: 0.6 })} />
            <Box size={[mm(56), mm(17), mm(1.6)]} position={[mm(6), 0, mm(3.3)]} material={mat(d.brand === 'Samsung' ? '#121212' : '#1d2026', { rough: 0.3 })} />
            {i === 0 && <Box size={[mm(82), mm(24), mm(gen5 ? 14 : 6)]} position={[0, 0, mm(gen5 ? 10 : 7)]} material={mat('#4a525e', { metal: 0.9, rough: 0.3, opacity: 0.55 })} castShadow={false} />}
            <Box size={[mm(6), mm(3), mm(0.6)]} position={[-mm(32), mm(6), mm(4.4)]} material={ledMaterial} castShadow={false} />
            <Box size={[mm(5), mm(20), mm(1.3)]} position={[mm(40), 0, mm(2)]} material={mat('#d4af37', { metal: 1, rough: 0.25 })} castShadow={false} />
          </group>
        )
      })}
    </group>
  )
}
