import { Edges } from '@react-three/drei'
import type { Case, Fans, PSU, Storage } from '../../data/types'
import { useSettings } from '../../store/settings'
import { glassMaterial, ledMaterial, mat, meshPanelMaterial, rgbMaterial } from './materials'
import { Box, Fan } from './primitives'
import { mm, type Layout } from './layout'

/* --------------------------------------------------------------- case shell */
export function CaseShell({ L, pcCase }: { L: Layout; pcCase?: Case }) {
  const glassOn = useSettings((s) => s.glass && s.explode < 0.08)
  const xray = useSettings((s) => s.xray)
  const { D, H, W } = L
  const white = pcCase?.color === 'white'
  const base = white ? '#e8ecf1' : '#17191e'
  const op = xray ? 0.12 : 1
  const solid = mat(base, { metal: 0.55, rough: 0.45, opacity: op })
  const inner = mat(white ? '#dfe4ea' : '#111317', { metal: 0.4, rough: 0.7, opacity: xray ? 0.1 : 1 })
  const t = mm(4)
  const frontMesh = pcCase?.panel !== 'glass'
  const wood = pcCase?.brand === 'Fractal Design' && pcCase.name.startsWith('North')
  const sideMesh = pcCase?.panel === 'mesh'
  if (!pcCase) {
    // ghost case outline
    return (
      <mesh position={[0, H / 2, 0]}>
        <boxGeometry args={[D, H, W]} />
        <meshBasicMaterial color="#38e8c6" transparent opacity={0.025} depthWrite={false} />
        <Edges color="#38e8c6" />
      </mesh>
    )
  }
  return (
    <group>
      {/* back wall (motherboard tray) */}
      <Box size={[D, H, t]} position={[0, H / 2, -W / 2 + t / 2]} material={inner} castShadow={false} />
      {/* top and bottom */}
      <Box size={[D, t, W]} position={[0, H - t / 2, 0]} material={frontMesh ? meshPanelMaterial(base, xray) : solid} castShadow={false} />
      <Box size={[D, t, W]} position={[0, t / 2, 0]} material={solid} castShadow={false} />
      {/* rear panel with I/O cut-out impression */}
      <Box size={[t, H, W]} position={[D / 2 - t / 2, H / 2, 0]} material={meshPanelMaterial(base, xray)} castShadow={false} />
      {/* front panel */}
      <Box size={[t, H, W]} position={[-D / 2 + t / 2, H / 2, 0]} material={frontMesh ? meshPanelMaterial(base, xray) : glassMaterial} castShadow={false} />
      {wood &&
        Array.from({ length: 9 }).map((_, i) => (
          <Box key={i} size={[mm(10), H - mm(30), mm(9)]} position={[-D / 2 - mm(4), H / 2, -W / 2 + mm(26) + i * ((W - mm(52)) / 8)]} material={mat('#7a5232', { rough: 0.8, metal: 0, opacity: op })} castShadow={false} />
        ))}
      {/* PSU shroud */}
      {L.shroudH > 0 && (
        <group>
          <Box size={[D - mm(10), t, W - mm(10)]} position={[0, L.shroudH, 0]} material={mat(base, { metal: 0.5, rough: 0.5, opacity: xray ? 0.12 : 0.92 })} castShadow={false} />
          <Box size={[D * 0.7, L.shroudH, t]} position={[D * 0.15 - mm(5), L.shroudH / 2, W / 2 - mm(16)]} material={mat(base, { metal: 0.5, rough: 0.5, opacity: xray ? 0.1 : 0.55 })} castShadow={false} />
        </group>
      )}
      {/* glass / mesh side panel */}
      {glassOn && (
        <mesh position={[0, H / 2, W / 2 - mm(2)]} material={sideMesh ? meshPanelMaterial(base, true) : glassMaterial} userData={{ noBounds: true }}>
          <boxGeometry args={[D - mm(6), H - mm(6), mm(3)]} />
        </mesh>
      )}
      {/* frame edges for crisp silhouette */}
      <mesh position={[0, H / 2, 0]} userData={{ noBounds: true }}>
        <boxGeometry args={[D, H, W]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges color={white ? '#aab4c0' : '#3b414b'} threshold={15} />
      </mesh>
      {/* feet */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b], i) => (
        <Box key={i} size={[mm(40), mm(12), mm(20)]} position={[a * (D / 2 - mm(40)), -mm(6), b * (W / 2 - mm(25))]} material={mat('#0b0c0f', { rough: 0.9 })} />
      ))}
      {/* front I/O + power LED */}
      <Box size={[mm(70), mm(6), mm(20)]} position={[-D / 2 + mm(50), H + mm(1), W / 2 - mm(30)]} material={mat('#0e0f12')} castShadow={false} />
      <Box size={[mm(6), mm(2), mm(6)]} position={[-D / 2 + mm(20), H + mm(3), W / 2 - mm(30)]} material={ledMaterial} castShadow={false} />
      {pcCase.rgb && <Box size={[mm(3), H - mm(40), mm(3)]} position={[-D / 2 + mm(8), H / 2, W / 2 - mm(10)]} material={rgbMaterial} castShadow={false} />}
    </group>
  )
}

/* --------------------------------------------------------------- PSU */
export function PsuModel({ L, psu }: { L: Layout; psu: PSU }) {
  const { pos, d, h, w } = L.psu
  const color = psu.brand === 'be quiet!' ? '#141414' : psu.brand === 'Corsair' ? '#1b1b1d' : psu.brand === 'Seasonic' ? '#202226' : '#24272c'
  const label = psu.brand === 'be quiet!' ? '#f97316' : psu.efficiency.includes('Platinum') ? '#cbd5e1' : psu.efficiency.includes('Gold') ? '#eab308' : '#b45309'
  return (
    <group position={pos}>
      <Box size={[d, h, w]} material={mat(color, { metal: 0.6, rough: 0.45 })} />
      {/* side label facing the glass */}
      <Box size={[d * 0.7, h * 0.55, mm(0.6)]} position={[0, 0, w / 2 + mm(0.3)]} material={mat(label, { metal: 0.3, rough: 0.5 })} castShadow={false} />
      {/* fan grill underneath */}
      <mesh position={[0, -h / 2 - mm(0.5), 0]} rotation={[Math.PI / 2, 0, 0]} material={mat('#0a0b0d', { metal: 0.6, rough: 0.5 })}>
        <circleGeometry args={[Math.min(d, w) * 0.42, 32]} />
      </mesh>
      {/* modular sockets on the front face */}
      <Box size={[mm(1), h * 0.6, w * 0.7]} position={[-d / 2 - mm(0.5), 0, 0]} material={mat('#050506')} castShadow={false} />
    </group>
  )
}

/* --------------------------------------------------------------- case fans */
export function CaseFans({ L, fans, pcCase }: { L: Layout; fans?: Fans; pcCase?: Case }) {
  if (!pcCase) return null
  const rgb = !!fans?.rgb || !!pcCase.rgb
  const white = (fans?.color ?? pcCase.color) === 'white'
  const frame = white ? '#f2f4f7' : '#15171c'
  const blade = white ? '#f2f4f7' : '#1f2228'
  const s = L.fanSize
  const d = mm(25)
  return (
    <group>
      {L.frontFans.map((p, i) => <Fan key={'f' + i} size={s} depth={d} position={p} rotation={[0, Math.PI / 2, 0]} rgb={rgb} frame={frame} blade={blade} />)}
      {L.rearFans.map((p, i) => <Fan key={'r' + i} size={s} depth={d} position={p} rotation={[0, Math.PI / 2, 0]} rgb={rgb} frame={frame} blade={blade} />)}
      {L.topFans.map((p, i) => <Fan key={'t' + i} size={s} depth={d} position={p} rotation={[-Math.PI / 2, 0, 0]} rgb={rgb} frame={frame} blade={blade} />)}
      {L.bottomFans.map((p, i) => <Fan key={'b' + i} size={s} depth={d} position={p} rotation={[-Math.PI / 2, 0, 0]} rgb={rgb} frame={frame} blade={blade} />)}
    </group>
  )
}

/* --------------------------------------------------------------- SATA / HDD drives */
export function DriveModels({ L, drives }: { L: Layout; drives: Storage[] }) {
  const sata = drives.filter((d) => d.formFactor === '2.5"')
  const hdd = drives.filter((d) => d.formFactor === '3.5"')
  return (
    <group>
      {sata.map((d, i) => (
        <group key={d.id + i} position={[L.sata[0], L.sata[1] + i * mm(9), L.sata[2]]}>
          <Box size={[mm(100), mm(7), mm(70)]} material={mat('#1e2126', { metal: 0.6, rough: 0.4 })} />
          <Box size={[mm(60), mm(0.5), mm(40)]} position={[0, mm(3.8), 0]} material={mat('#2563eb', { rough: 0.5 })} castShadow={false} />
        </group>
      ))}
      {hdd.map((d, i) => (
        <group key={d.id + i} position={[L.hdd[0], L.hdd[1] + mm(13) + i * mm(30), L.hdd[2]]}>
          <Box size={[mm(147), mm(26), mm(101)]} material={mat('#9aa3ad', { metal: 0.9, rough: 0.35 })} />
          <Box size={[mm(90), mm(0.5), mm(60)]} position={[0, mm(13.3), 0]} material={mat('#e5e7eb', { rough: 0.6 })} castShadow={false} />
        </group>
      ))}
    </group>
  )
}
