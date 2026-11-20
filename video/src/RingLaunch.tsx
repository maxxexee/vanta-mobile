import React from 'react'
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { AccentGlow, C, Chroma, DISPLAY, Grain, HeadSwitch, MONO, SANS, Scanlines, Vignette } from './vhs'

/**
 * Custom Ring v2 launch assets — the launch card (1600×900 still) and the 20s film.
 *
 * Every address, signature, slot and fee on screen was decoded from devnet with the
 * same getTransaction pass as scripts/who-signs-*.mjs, on 2026-10-21:
 *
 *   v1 default-ring Shadow  4xDGsYYX…EJVY  slot 506148898
 *     feePayer 141cNkh4…D4HrE (the spend identity X itself)
 *     1 signer — X. fee 5000 lamports. err null.
 *
 *   v2 ring Shadow from APK 4ucu98jH…pgap  slot 512979955
 *   v2 ring Ghost  from APK 4aiLF66u…xYajQ slot 512980998
 *     feePayer FhV7cyfV…uRk7 — the RELAYER.
 *     2 signers: relayer + 2QnVHxmV…k2p4 (the owner, co-signing). fee 10000. err null.
 *
 * Ring program 8aMW8MPHBn4oGsss2NuB4QNvFx6iBSB8RHHkMAHrZduU (devnet, test phase).
 * Nothing here is illustrative; re-verify with getTransaction on any of the sigs.
 */

export const RING = {
  v1Sig: '4xDGsYYXPhDWmGkXn1qPoe3uKhc1hgxG38VUoLFKzHQ4SovMpA4XbnULrU3wA4RV94irTY8Dn77T7RZ6bgChEJVY',
  v1FeePayer: '141cNkh4Z9XQ3nBBW2YX3L3o9XqoRQXEaU4jxdfD4HrE',
  v1Slot: 506148898,
  v2ShadowSig: '4ucu98jHyDyCg8nnrgD8L5znTpj5cBacWgg7t5TTtnoU5DWHbSsJGeJPvpMAhPgq1rBBxnySaRVfkPWpjQPtgpap',
  v2GhostSig: '4aiLF66uQzYZbVtFBEi6rHvEcr2dSmDKqpEF631FTQcnaX13BL5M8HqazYH69DRBYvN8CoCb77cjATDrMuVxYajQ',
  v2FeePayer: 'FhV7cyfVAC8gyQqSRYiw5oKdC95GVw83ukvxhhu7uRk7',
  v2CoSigner: '2QnVHxmVNQ5LEYzKV8RzQcrxfQRf675J9DbJoJb4k2p4',
  v2ShadowSlot: 512979955,
  v2GhostSlot: 512980998,
  program: '8aMW8MPHBn4oGsss2NuB4QNvFx6iBSB8RHHkMAHrZduU',
} as const

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`

const enter = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.6 } })

const snap = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 30, mass: 0.35 } })

/* ── LAUNCH CARD (still, 1600×900) ───────────────────────────────────── */

const CardColumn: React.FC<{
  tag: string
  tagColor: string
  sig: string
  slot: number
  feePayer: string
  payerLabel: string
  payerColor: string
  signers: string
  needsSol: string
  needsSolColor: string
  identity: string
  identityColor: string
}> = ({ tag, tagColor, sig, slot, feePayer, payerLabel, payerColor, signers, needsSol, needsSolColor, identity, identityColor }) => (
  <div
    style={{
      flex: 1,
      backgroundColor: C.card,
      border: `1px solid ${tagColor}44`,
      borderRadius: 22,
      padding: '40px 46px',
      position: 'relative',
    }}
  >
    <div style={{ fontFamily: MONO, fontSize: 21, letterSpacing: '0.3em', color: tagColor, marginBottom: 26 }}>
      {tag}
    </div>
    <div style={{ fontFamily: MONO, fontSize: 23, color: C.muted, marginBottom: 30 }}>
      fee payer&nbsp;&nbsp;<span style={{ color: payerColor, fontWeight: 700 }}>{short(feePayer)}</span>
      <span style={{ color: payerLabel === 'you' ? C.danger : C.accent, marginLeft: 14, letterSpacing: '0.14em' }}>
        {payerLabel === 'you' ? '◀ YOU' : '◀ RELAYER'}
      </span>
    </div>
    <Row k="signers" v={signers} />
    <Row k="spend identity" v={identity} color={identityColor} />
    <Row k="you need SOL" v={needsSol} color={needsSolColor} />
    <div style={{ marginTop: 30, fontFamily: MONO, fontSize: 18, color: C.muted, lineHeight: 1.6 }}>
      {short(sig)} · slot {slot} · err null
    </div>
  </div>
)

const Row: React.FC<{ k: string; v: string; color?: string }> = ({ k, v, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
    <span style={{ fontFamily: SANS, fontSize: 26, color: C.white }}>{k}</span>
    <span style={{ fontFamily: MONO, fontSize: 23, letterSpacing: '0.08em', color: color ?? C.white }}>{v}</span>
  </div>
)

export const RingCard: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.canvas, padding: '64px 72px' }}>
    <AbsoluteFill style={{ padding: '64px 72px', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: '0.34em', color: C.accent, marginBottom: 18 }}>
          CUSTOM RING v2 · SHIPPED · DEVNET TEST PHASE
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 76, fontWeight: 700, color: C.white, letterSpacing: '-0.035em', lineHeight: 1.02 }}>
          THE RELAYER PAYS THE FEE.
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 76, fontWeight: 300, color: C.white, letterSpacing: '-0.035em', lineHeight: 1.06 }}>
          YOUR SPEND CARRIES <span style={{ color: C.accent }}>NO IDENTITY.</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 40 }}>
        <CardColumn
          tag="v1 · DEFAULT RING"
          tagColor={C.danger}
          sig={RING.v1Sig}
          slot={RING.v1Slot}
          feePayer={RING.v1FeePayer}
          payerLabel="you"
          payerColor={C.white}
          signers="1 — you"
          identity="yours, reused"
          identityColor={C.danger}
          needsSol="yes"
          needsSolColor={C.danger}
        />
        <CardColumn
          tag="v2 · CUSTOM RING"
          tagColor="#5fd68a"
          sig={RING.v2ShadowSig}
          slot={RING.v2ShadowSlot}
          feePayer={RING.v2FeePayer}
          payerLabel="relayer"
          payerColor="#5fd68a"
          signers="2 — relayer + you"
          identity="none on chain"
          identityColor="#5fd68a"
          needsSol="no"
          needsSolColor="#5fd68a"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontFamily: MONO, fontSize: 19, color: C.muted, lineHeight: 1.7 }}>
          ring {RING.program}
          <br />
          confidential, not anonymous · ring auditor can open a transfer · unaudited
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 40, fontWeight: 700, color: C.white, letterSpacing: '-0.03em' }}>
          VANTA&nbsp;&nbsp;<span style={{ color: C.accent, fontWeight: 300 }}>vanta-mobile.xyz</span>
        </div>
      </div>
    </AbsoluteFill>
    <Scanlines opacity={0.1} />
    <Grain opacity={0.07} id="grain-card" />
    <Vignette strength={0.55} />
  </AbsoluteFill>
)

/* ── LAUNCH FILM (20s, 1920×1080) ────────────────────────────────────── */

export const RING_SCENES = {
  hook: { from: 0, dur: 120 },
  who: { from: 120, dur: 150 },
  diff: { from: 270, dur: 180 },
  proof: { from: 450, dur: 90 },
  cta: { from: 540, dur: 60 },
} as const

export const RING_TOTAL_FRAMES = 600

const SceneShell: React.FC<{ tearSeed: number; children: React.ReactNode }> = ({ tearSeed, children }) => (
  <AbsoluteFill style={{ backgroundColor: C.canvas }}>
    {children}
    <Sequence from={0} durationInFrames={14}>
      <HeadSwitch />
    </Sequence>
    <Scanlines />
    <Grain id={`grain-${tearSeed}`} />
    <Vignette />
  </AbsoluteFill>
)

const Label: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: MONO, fontSize: 25, letterSpacing: '0.34em', color: C.muted, textTransform: 'uppercase', ...style }}>
    {children}
  </div>
)

/* Scene 1 — hook */
const Hook: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const a = enter(frame, fps, 4)
  const b = enter(frame, fps, 20)
  const drift = interpolate(frame, [0, 120], [0, -10])
  return (
    <SceneShell tearSeed={1}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <AccentGlow size={1050} intensity={0.3 + 0.08 * Math.sin(frame / 16)}>
          <Chroma amount={4}>
            <div style={{ textAlign: 'center', transform: `translateY(${drift}px)` }}>
              <Label style={{ marginBottom: 30, opacity: a }}>Custom ring v2 · devnet · test phase</Label>
              <div style={{ fontFamily: DISPLAY, fontSize: 108, fontWeight: 700, color: C.white, letterSpacing: '-0.035em', lineHeight: 1, opacity: a }}>
                THE RELAYER PAYS
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 108, fontWeight: 300, color: C.white, letterSpacing: '-0.035em', lineHeight: 1.05, opacity: b, transform: `translateY(${(1 - b) * 24}px)` }}>
                THE TRANSACTION FEE.
              </div>
            </div>
          </Chroma>
        </AccentGlow>
      </AbsoluteFill>
    </SceneShell>
  )
}

/* Scene 2 — the identity claim, one decoded tx */
const Who: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const a = enter(frame, fps, 0)
  const b = enter(frame, fps, 16)
  const line = snap(frame, fps, 70)
  return (
    <SceneShell tearSeed={2}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Chroma amount={3}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 92, fontWeight: 300, color: C.muted, letterSpacing: '-0.03em', opacity: a }}>
              YOUR SPEND USED TO CARRY
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 116, fontWeight: 700, color: C.danger, letterSpacing: '-0.04em', opacity: b, transform: `scale(${0.96 + b * 0.04})`, textShadow: `0 0 54px ${C.danger}55` }}>
              A REUSED IDENTITY.
            </div>
            <div style={{ marginTop: 54, opacity: line, fontFamily: MONO, fontSize: 27, color: C.white, letterSpacing: '0.1em' }}>
              fee payer <span style={{ color: C.danger }}>{short(RING.v1FeePayer)}</span> — same address, every send
            </div>
          </div>
        </Chroma>
      </AbsoluteFill>
    </SceneShell>
  )
}

/* Scene 3 — the diff, real decode rows */
const DiffRow: React.FC<{ k: string; v1: string; v2: string; delay: number }> = ({ k, v1, v2, delay }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = snap(frame, fps, delay)
  return (
    <div style={{ display: 'flex', alignItems: 'center', opacity: s, transform: `translateX(${(1 - s) * 26}px)`, padding: '17px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <span style={{ fontFamily: SANS, fontSize: 31, color: C.white, width: 380 }}>{k}</span>
      <span style={{ fontFamily: MONO, fontSize: 29, color: C.danger, width: 460 }}>{v1}</span>
      <span style={{ fontFamily: MONO, fontSize: 29, color: '#5fd68a', width: 460 }}>{v2}</span>
    </div>
  )
}

const Diff: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const head = enter(frame, fps, 0)
  return (
    <SceneShell tearSeed={3}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 1340 }}>
          <div style={{ display: 'flex', marginBottom: 26, opacity: head }}>
            <span style={{ width: 380 }} />
            <span style={{ fontFamily: MONO, fontSize: 24, letterSpacing: '0.26em', color: C.danger, width: 460 }}>v1 DEFAULT RING</span>
            <span style={{ fontFamily: MONO, fontSize: 24, letterSpacing: '0.26em', color: '#5fd68a', width: 460 }}>v2 CUSTOM RING</span>
          </div>
          <DiffRow k="fee payer" v1="you" v2="relayer" delay={16} />
          <DiffRow k="signers" v1="1 — you" v2="2 — relayer + you" delay={32} />
          <DiffRow k="spend identity" v1="yours, reused" v2="none on chain" delay={48} />
          <DiffRow k="you need SOL" v1="yes" v2="no" delay={64} />
          <div style={{ marginTop: 40, fontFamily: MONO, fontSize: 23, color: C.muted, letterSpacing: '0.18em', opacity: enter(frame, fps, 84), textAlign: 'center' }}>
            BOTH DECODED WITH getTransaction — LINKS IN THE REPO
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  )
}

/* Scene 4 — on-chain proof */
const ProofLine: React.FC<{ k: string; v: string; delay: number; accent?: boolean }> = ({ k, v, delay, accent }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = snap(frame, fps, delay)
  return (
    <div style={{ display: 'flex', gap: 30, opacity: s, marginBottom: 17 }}>
      <span style={{ fontFamily: MONO, fontSize: 28, color: C.muted, width: 200, textAlign: 'right' }}>{k}</span>
      <span style={{ fontFamily: MONO, fontSize: 28, color: accent ? '#5fd68a' : C.white }}>{v}</span>
    </div>
  )
}

const Proof: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const title = enter(frame, fps, 0)
  return (
    <SceneShell tearSeed={4}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Chroma amount={2}>
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: 46, fontWeight: 700, color: C.white, letterSpacing: '0.02em', opacity: title, marginBottom: 44, textAlign: 'center' }}>
              CONFIRMED ON DEVNET — FROM THE APK
            </div>
            <ProofLine k="shadow" v={`${short(RING.v2ShadowSig)} · slot ${RING.v2ShadowSlot}`} delay={14} />
            <ProofLine k="ghost" v={`${short(RING.v2GhostSig)} · slot ${RING.v2GhostSlot}`} delay={26} />
            <ProofLine k="fee payer" v={`${short(RING.v2FeePayer)} — the relayer`} delay={38} accent />
            <ProofLine k="co-signer" v={`${short(RING.v2CoSigner)} — the owner`} delay={50} accent />
            <ProofLine k="err" v="null" delay={62} accent />
          </div>
        </Chroma>
      </AbsoluteFill>
    </SceneShell>
  )
}

/* Scene 5 — honest CTA */
const Cta: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const mark = enter(frame, fps, 0)
  const sub = enter(frame, fps, 12)
  const foot = enter(frame, fps, 24)
  return (
    <SceneShell tearSeed={5}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <AccentGlow size={950} intensity={0.34}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 156, fontWeight: 700, color: C.white, letterSpacing: '-0.05em', opacity: mark, lineHeight: 1, textShadow: `0 0 76px ${C.accentDeep}` }}>
              VANTA
            </div>
            <div style={{ marginTop: 20, fontFamily: DISPLAY, fontSize: 42, fontWeight: 300, color: C.accent, letterSpacing: '-0.02em', opacity: sub }}>
              Custom ring v2 — spend without a spend identity.
            </div>
            <div style={{ marginTop: 44, fontFamily: MONO, fontSize: 24, color: C.muted, letterSpacing: '0.16em', opacity: foot, lineHeight: 1.8 }}>
              devnet · test phase · unaudited · confidential, not anonymous
              <br />
              vanta-mobile.xyz
            </div>
          </div>
        </AccentGlow>
      </AbsoluteFill>
    </SceneShell>
  )
}

export const RingFilm: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.canvas }}>
    <Sequence from={RING_SCENES.hook.from} durationInFrames={RING_SCENES.hook.dur}>
      <Hook />
    </Sequence>
    <Sequence from={RING_SCENES.who.from} durationInFrames={RING_SCENES.who.dur}>
      <Who />
    </Sequence>
    <Sequence from={RING_SCENES.diff.from} durationInFrames={RING_SCENES.diff.dur}>
      <Diff />
    </Sequence>
    <Sequence from={RING_SCENES.proof.from} durationInFrames={RING_SCENES.proof.dur}>
      <Proof />
    </Sequence>
    <Sequence from={RING_SCENES.cta.from} durationInFrames={RING_SCENES.cta.dur}>
      <Cta />
    </Sequence>
  </AbsoluteFill>
)
