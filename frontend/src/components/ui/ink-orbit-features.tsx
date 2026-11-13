"use client"

// Adapted from the supplied ink-orbit-features template for SideBy.
// Workflow graphics and scores are explicitly illustrative, with no network requests.
//
// Uses the existing React/Lucide packages; no remote assets or extra dependencies.

import React from "react"
import { ArrowRight, FileSearch, GitCompareArrows, FileCheck2 } from "@/components/icons"
import "./ink-orbit-features.css"

export type InkFeatureCopy = { title: string; description: string }
export type InkFeatures = {
  tag: string
  /** Asterisks mark muted words; real or escaped newlines start a new line. */
  title: string
  collaboration: InkFeatureCopy
  reports: InkFeatureCopy
  integrations: InkFeatureCopy & { tools: string[] }
  insights: InkFeatureCopy & { values: number[]; labels: string[] }
}

export type InkOrbitFeaturesProps = {
  /** `auto` follows prefers-color-scheme. */
  theme?: "light" | "dark" | "auto"
  /** Shown on the hub chip in the flow diagram (first word, uppercased). */
  brand?: string
  tag?: string
  title?: string
  collaboration?: { [K in keyof InkFeatureCopy]?: InkFeatureCopy[K] }
  reports?: { [K in keyof InkFeatureCopy]?: InkFeatureCopy[K] }
  integrations?: { [K in keyof InkFeatures["integrations"]]?: InkFeatures["integrations"][K] }
  insights?: { [K in keyof InkFeatures["insights"]]?: InkFeatures["insights"][K] }
  className?: string
  style?: React.CSSProperties
}

/* ------------------------------------------------------------------ logic */

// #region logic
function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

// Smooth line + closed area through values, inside a w×h box.
function chartPaths(values: number[], w: number, h: number, pad: number) {
  const n = values.length
  const lo = 0
  const hi = 100
  const span = hi - lo || 1
  const pts = values.map((v, i) => [
    pad + (n < 2 ? 0 : (i / (n - 1)) * (w - pad * 2)),
    h - pad - ((v - lo) / span) * (h - pad * 2),
  ] as [number, number])
  let line = ""
  pts.forEach(([x, y], i) => {
    if (i === 0) {
      line = "M" + x.toFixed(1) + "," + y.toFixed(1)
      return
    }
    const [px, py] = pts[i - 1]
    const cx = (px + x) / 2
    line += " C" + cx.toFixed(1) + "," + py.toFixed(1) + " " + cx.toFixed(1) + "," + y.toFixed(1) + " " + x.toFixed(1) + "," + y.toFixed(1)
  })
  const area = n ? line + " L" + pts[n - 1][0].toFixed(1) + "," + (h - pad) + " L" + pts[0][0].toFixed(1) + "," + (h - pad) + " Z" : ""
  return { line, area, points: pts }
}

function nearestIndex(xs: number[], x: number): number {
  let best = 0
  for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i
  return best
}

function parseTitle(s: string): { text: string; muted: boolean }[][] {
  return s.split(/\n|\\n/).map(line => line.split("*").map((text, i) => ({ text, muted: i % 2 === 1 })).filter(run => run.text))
}
// #endregion logic

/* --------------------------------------------------------------- defaults */

const D_FEATURES: InkFeatures = {
  tag: "Features",
  title: "Research that stays *connected*",
  collaboration: {
    title: "Start with the evidence",
    description: "Bring official docs, public sources, and project requirements into the same comparison.",
  },
  reports: {
    title: "Keep the reasoning",
    description: "Inspect cited facts, decision dimensions, and the verdict together. Export the record when you need it.",
  },
  integrations: {
    title: "Ground the comparison",
    description: "Explore the inputs SideBy can use. These illustrate the workflow; no accounts are connected here.",
    tools: ["Docs", "Uploads", "Sources", "Projects"],
  },
  insights: {
    title: "Inspect each dimension",
    description: "Choose a dimension to explore an illustrative score. Real comparison scores depend on the evidence and your requirements.",
    values: [68, 82, 74, 90, 76],
    labels: ["Features", "Pricing", "Reliability", "Documentation", "Fit"],
  },
}

/* -------------------------------------------------------------- component */

export default function InkOrbitFeatures({
  theme = "auto",
  brand = "SideBy",
  tag = D_FEATURES.tag,
  title = D_FEATURES.title,
  collaboration,
  reports,
  integrations,
  insights,
  className = "",
  style,
}: InkOrbitFeaturesProps) {
  const uid = "ib" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const F: InkFeatures = {
    tag,
    title,
    collaboration: { ...D_FEATURES.collaboration, ...collaboration },
    reports: { ...D_FEATURES.reports, ...reports },
    integrations: { ...D_FEATURES.integrations, ...integrations },
    insights: { ...D_FEATURES.insights, ...insights },
  }

  const [dark, setDark] = React.useState(theme === "dark")
  const [reduced, setReduced] = React.useState(true)
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      setDark(theme === "dark")
      return
    }
    const scheme = window.matchMedia("(prefers-color-scheme: dark)")
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      setDark(theme === "auto" ? scheme.matches : theme === "dark")
      setReduced(motion.matches)
    }
    sync()
    scheme.addEventListener?.("change", sync)
    motion.addEventListener?.("change", sync)
    return () => {
      scheme.removeEventListener?.("change", sync)
      motion.removeEventListener?.("change", sync)
    }
  }, [theme])

  const [featRef, featIn] = useInView(0.12)
  const [rootRef, active] = useAnimationVisibility()
  const paused = reduced || !active

  return (
    <div ref={rootRef} className={"ib-root " + className} data-animate={!paused} data-theme={dark ? "dark" : "light"} style={style}>
      <div className="ib-shell">
        <section className="ib-sec" aria-labelledby={uid + "feat"}>
          <div className="ib-reveal" ref={featRef} data-in={featIn}>
            <div className="ib-head" id={uid + "feat"}>
              {F.tag && <span className="ib-tag">{F.tag}</span>}
              <Title text={F.title} />
            </div>
            <div className="ib-bento">
              <FlowCard brand={brand} features={F} uid={uid} reduced={paused} />
              <IntegrationsCard copy={F.integrations} />
              <InsightsCard copy={F.insights} uid={uid} reduced={paused} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- pieces */

// true once the element has been on screen
function useInView(threshold = 0.2) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (typeof IntersectionObserver !== "function") {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, threshold])
  return [ref, inView] as const
}

/** Pause SVG motion offscreen and while the installed PWA is backgrounded. */
function useAnimationVisibility() {
  const ref = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)
  const [foreground, setForeground] = React.useState(false)
  React.useEffect(() => {
    const sync = () => setForeground(document.visibilityState === "visible")
    sync()
    document.addEventListener("visibilitychange", sync)
    const observer = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(entries => setVisible(entries.some(entry => entry.isIntersecting)))
      : null
    if (ref.current && observer) observer.observe(ref.current)
    else setVisible(true)
    return () => { observer?.disconnect(); document.removeEventListener("visibilitychange", sync) }
  }, [])
  return [ref, visible && foreground] as const
}

function Brackets() {
  return (
    <>
      <span className="ib-c ib-c-tl" aria-hidden="true" />
      <span className="ib-c ib-c-tr" aria-hidden="true" />
      <span className="ib-c ib-c-bl" aria-hidden="true" />
      <span className="ib-c ib-c-br" aria-hidden="true" />
    </>
  )
}

function Title({ text, className = "ib-h2", as = "h2" }: { text: string; className?: string; as?: "h2" | "h3" }) {
  const Tag = as
  return (
    <Tag className={className}>
      {parseTitle(text).map((line, i) => (
        <span key={i}>
          {line.map((run, j) => (
            <React.Fragment key={j}>{run.muted ? <span className="ib-muted" style={{ display: "inline" }}>{run.text}</span> : run.text}</React.Fragment>
          ))}
        </span>
      ))}
    </Tag>
  )
}

function Mark({ size = 18 }: { size?: number }) {
  return <GitCompareArrows width={size} height={size} aria-hidden="true" />
}

function ToolGlyph({ index }: { index: number }) {
  const k = index % 4
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {k === 0 && (
        <>
          <rect x="-6" y="-6" width="12" height="12" rx="1.5" />
          <path d="M-6 -2h12M-6 2h12M-1.5 -6v12" />
        </>
      )}
      {k === 1 && <path d="M-6.5 4 -2 -5h4l4.5 9zm2.4 0h9.2M-2 -5l4.5 9" />}
      {k === 2 && (
        <>
          <path d="M-4.5 -6.5h6l3 3v10h-9z" />
          <path d="M-2 0h4.5M-2 3h4.5" />
        </>
      )}
      {k === 3 && (
        <>
          <circle cx="-1" cy="-1" r="4.5" />
          <path d="M2.4 2.4 6 6" />
        </>
      )}
    </g>
  )
}

function FlowCard({ brand, features, uid, reduced }: { brand: string; features: InkFeatures; uid: string; reduced: boolean }) {
  const [side, setSide] = React.useState("" as "" | "left" | "right")
  const team = [
    { x: 58, y: 38, name: "Official docs" },
    { x: 104, y: 22, name: "Pricing pages" },
    { x: 150, y: 40, name: "Project notes" },
    { x: 46, y: 92, name: "Public sources" },
    { x: 146, y: 114, name: "Requirements" },
  ]
  const L1 = "M117,67 C196,67 210,100 262,100" // out of the team node …
  const L2 = "M117,73 C186,73 206,120 262,120" // … into the hub chip
  const R1 = "M378,100 C412,100 418,86 450,86" // hub → front report sheet
  const R2 = "M378,120 C412,120 418,134 450,134"
  const chip = brand.split(" ")[0].toUpperCase()
  const chipLong = chip.length * 6.7 > 58 // ~6.7px per char at 8.5px + 1.4 tracking
  const rays = uid + "rays"
  const glow = uid + "glow"
  return (
    <div className="ib-frame ib-frame-hover ib-wide">
      <Brackets />
      <div className="ib-card" style={{ padding: 0, overflow: "hidden" }}>
        <svg className="ib-diagram ib-wide-diagram" viewBox="0 0 640 178" role="img" aria-label={"Illustration: sources and requirements flow through " + brand + " into a cited comparison"}>
          <defs>
            <radialGradient id={glow} cx="320" cy="110" r="190" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="var(--ib-raise)" stopOpacity="1" />
              <stop offset="1" stopColor="var(--ib-raise)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={rays} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--ib-line-strong)" stopOpacity=".55" />
              <stop offset="1" stopColor="var(--ib-line-strong)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="640" height="178" fill={"url(#" + glow + ")"} />
          {[-62, -38, -14, 14, 38, 62].map((a, i) => (
            <path key={i} d={"M320,110 L" + (320 + Math.sin((a * Math.PI) / 180) * 260) + "," + (110 - Math.cos((a * Math.PI) / 180) * 260) + " L" + (320 + Math.sin(((a + 7) * Math.PI) / 180) * 260) + "," + (110 - Math.cos(((a + 7) * Math.PI) / 180) * 260) + "Z"} fill={"url(#" + rays + ")"} opacity=".5" />
          ))}

          <g onMouseEnter={() => setSide("left")} onMouseLeave={() => setSide("")}>
            {team.map((m, i) => <g key={m.name}>
              <line x1={m.x} y1={m.y} x2="104" y2="70" stroke="var(--ib-line-strong)" strokeDasharray="2 3" />
              <rect x={m.x-12} y={m.y-12} width="24" height="24" rx="5" className="ib-node" />
              <g transform={`translate(${m.x},${m.y})`}><ToolGlyph index={i} /></g>
            </g>)}
          </g>

          {/* connectors */}
          {[L1, L2].map((d, i) => (
            <path key={d} d={d} className={"ib-flow" + (side === "left" ? " ib-flow-on" : "") + (i ? " ib-dash" : "")} />
          ))}
          {[R1, R2].map((d, i) => (
            <path key={d} d={d} className={"ib-flow" + (side === "right" ? " ib-flow-on" : "") + (i ? " ib-dash" : "")} />
          ))}
          {!reduced &&
            [L1, L2, R1, R2].map((d, i) => (
              <circle key={"p" + i} r="2.2" className="ib-pkt">
                <animateMotion dur={2.2 + (i % 2) * 0.6 + "s"} begin={i * 0.35 + "s"} repeatCount="indefinite" path={d} />
              </circle>
            ))}

          {/* the hub chip */}
          <g transform="translate(262,88)">
            <rect x="-4" y="-4" width="124" height="52" rx="8" fill="none" stroke="var(--ib-line)" className={reduced ? undefined : "ib-glow"} />
            <rect width="116" height="44" rx="6" className="ib-node" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,.08))" }} />
            <g transform="translate(13,14)" style={{ color: "var(--ib-ink)" }}>
              <Mark size={16} />
            </g>
            {/* 36→94 is all the room before the chevron; a long name is squeezed rather than run into it */}
            <text x="36" y="26" fontSize="8.5" letterSpacing="1.4" fontWeight="600" fill="var(--ib-soft)" fontFamily="var(--ib-sans)" textLength={chipLong ? 58 : undefined} lengthAdjust={chipLong ? "spacingAndGlyphs" : undefined}>
              {chip}
            </text>
            <path d="M100 18l4 4-4 4" fill="none" stroke="var(--ib-muted)" strokeWidth="1.3" />
          </g>

          {/* the report stack */}
          <g onMouseEnter={() => setSide("right")} onMouseLeave={() => setSide("")}>
            {[2, 1, 0].map((k) => (
              <g key={k} transform={"translate(" + (450 + k * 12) + "," + (40 - k * 10) + ")"} opacity={1 - k * 0.25}>
                <g className={"ib-sheet" + (k === 0 ? " ib-sheet-new" : "")}>
                <rect width="138" height="102" rx="3" fill="var(--ib-raise)" stroke="var(--ib-line-strong)" />
                {k === 0 && (
                  <>
                    <text x="10" y="16" fontSize="7" fill="var(--ib-muted)" fontFamily="var(--ib-mono)">
                      {"CITED COMPARISON"}
                    </text>
                    <rect x="10" y="24" width="64" height="5" rx="1" fill="var(--ib-ink)" opacity=".75" />
                    <rect x="10" y="33" width="92" height="3" rx="1" fill="var(--ib-line-strong)" />
                    <rect x="10" y="39" width="80" height="3" rx="1" fill="var(--ib-line-strong)" />
                    {[18, 26, 14, 30, 22, 34].map((h, j) => (
                      <rect key={j} x={12 + j * 13} y={92 - h} width="8" height={h} fill="var(--ib-ink)" opacity={0.25 + j * 0.12} />
                    ))}
                    <path d="M92 64h34M92 72h28M92 80h32" stroke="var(--ib-line-strong)" strokeWidth="2.5" />
                  </>
                )}
                </g>
              </g>
            ))}
          </g>
        </svg>
        <div className="ib-mobile-flow" aria-label="Illustration: sources to SideBy to a cited verdict">
          <span><FileSearch aria-hidden="true" size={20} />Sources</span><ArrowRight aria-hidden="true" size={16} />
          <span><GitCompareArrows aria-hidden="true" size={20} />{brand}</span><ArrowRight aria-hidden="true" size={16} />
          <span><FileCheck2 aria-hidden="true" size={20} />Verdict</span>
        </div>
        <div className="ib-wide-copy" style={{ padding: "0 22px 20px" }}>
          <div>
            <h3>{features.collaboration.title}</h3>
            <p>{features.collaboration.description}</p>
          </div>
          <div>
            <h3>{features.reports.title}</h3>
            <p>{features.reports.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function IntegrationsCard({ copy }: { copy: InkFeatures["integrations"] }) {
  const [on, setOn] = React.useState(0)
  const tiles = [
    { x: 66, y: 34 },
    { x: 66, y: 116 },
    { x: 234, y: 34 },
    { x: 234, y: 116 },
  ]
  const path = (i: number) => {
    const t = tiles[i]
    const dir = t.x < 150 ? -1 : 1
    return "M" + (150 + dir * 17) + ",75 H" + (150 + dir * 42) + " V" + t.y + " H" + (t.x - dir * 15)
  }
  return (
    <div className="ib-frame ib-frame-hover">
      <Brackets />
      <div className="ib-card">
        <svg className="ib-diagram" viewBox="0 0 300 150" aria-hidden="true">
          {tiles.map((_, i) => (
            <path key={i} d={path(i)} className={"ib-flow" + (on === i ? " ib-flow-on" : "")} />
          ))}
          <g transform="translate(133,58)">
            <rect width="34" height="34" rx="7" className="ib-node" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,.08))" }} />
            <g transform="translate(8,8)" style={{ color: "var(--ib-ink)" }}>
              <Mark size={18} />
            </g>
          </g>
          {tiles.map((t, i) => (
            <g
              key={i}
              className={"ib-tool" + (on === i ? " ib-tool-on" : "")}

            >
              <rect x={t.x - 15} y={t.y - 15} width="30" height="30" rx="6" className="ib-node" />
              <g transform={"translate(" + t.x + "," + t.y + ")"} style={{ color: "var(--ib-ink)" }}>
                <ToolGlyph index={i} />
              </g>
              <text x={t.x} y={t.y + (t.y < 75 ? -21 : 28)} textAnchor="middle" fontSize="8" fill="var(--ib-muted)" fontFamily="var(--ib-sans)" opacity={on === i ? 1 : 0} style={{ transition: "opacity .25s" }}>
                {copy.tools[i] ?? ""}
              </text>
            </g>
          ))}
          <text x="150" y="112" textAnchor="middle" fontSize="7" fill="var(--ib-faint)" fontFamily="var(--ib-mono)">
            {"EXAMPLE INPUTS"}
          </text>
        </svg>
        <div role="group" aria-label="Explore comparison inputs" className="ib-input-controls">
          {copy.tools.slice(0, 4).map((tool, index) => <button type="button" key={`${tool}-${index}`} aria-pressed={on === index}
            onClick={() => setOn(index)}>{tool}</button>)}
        </div>
        <p className="ib-example-note">Illustration · selected input: {copy.tools[on] ?? "Source"}</p>
        <div style={{ marginTop: "auto" }}>
          <h3>{copy.title}</h3>
          <p>{copy.description}</p>
        </div>
      </div>
    </div>
  )
}

function InsightsCard({ copy, uid, reduced }: { copy: InkFeatures["insights"]; uid: string; reduced: boolean }) {
  const [ref, inView] = useInView(0.3)
  const [hover, setHover] = React.useState(-1)
  const W = 300
  const H = 130
  const vals = copy.values.length > 1 ? copy.values.map(value => Number.isFinite(value) ? clamp(value, 0, 100) : 0) : [0, 0]
  const { line, area, points } = chartPaths(vals, W, H, 14)
  const fill = uid + "area"
  const last = points[points.length - 1]
  const [selected, setSelected] = React.useState(0)
  const i = clamp(hover >= 0 ? hover : selected, 0, vals.length - 1)
  const label = copy.labels[i] ?? `Dimension ${i + 1}`
  const sliderId = uid + "dimension"
  const p = points[i]
  const onMove = (e: PointerSvgEv) => {
    if (e.pointerType !== "mouse") return
    const r = e.currentTarget.getBoundingClientRect()
    setHover(nearestIndex(points.map((q) => q[0]), ((e.clientX - r.left) / r.width) * W))
  }
  return (
    <div className="ib-frame ib-frame-hover" ref={ref} data-in={inView}>
      <Brackets />
      <div className="ib-card">
        <svg className="ib-diagram ib-chart" viewBox={"0 0 " + W + " " + (H + 6)} onPointerMove={onMove} onPointerLeave={() => setHover(-1)} role="img" aria-label={"Illustrative dimension scores. Use the dimension slider below to explore each score."}>
          <defs>
            <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--ib-ink)" stopOpacity=".12" />
              <stop offset="1" stopColor="var(--ib-ink)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="14" x2={W - 14} y1={H * g} y2={H * g} stroke="var(--ib-line)" />
          ))}
          <path d={area} fill={"url(#" + fill + ")"} />
          <path d={line} fill="none" stroke="var(--ib-ink)" strokeWidth="1.4" pathLength={1} className="ib-line-draw" opacity=".85" />
          {hover >= 0 && <line x1={p[0]} x2={p[0]} y1="8" y2={H - 14} stroke="var(--ib-ink)" strokeOpacity=".35" />}
          {!reduced && hover < 0 && <circle cx={last[0]} cy={last[1]} r="7" fill="var(--ib-ink)" opacity=".15" className="ib-glow" />}
          <circle cx={p[0]} cy={p[1]} r="3.2" fill="var(--ib-raise)" stroke="var(--ib-ink)" strokeWidth="1.5" />
          <g transform={"translate(" + clamp(p[0], 40, W - 40) + "," + (p[1] < 34 ? p[1] + 22 : p[1] - 12) + ")"}>
            <rect x="-30" y="-11" width="60" height="15" rx="2" fill="var(--ib-inv)" />
            <text x="0" y="-1" textAnchor="middle" fontSize="7.5" fill="var(--ib-inv-ink)" fontFamily="var(--ib-mono)">
              {`${Math.round(vals[i])} / 100`}
            </text>
          </g>
        </svg>
        <div className="ib-score-control">
          <label htmlFor={sliderId}>Explore example scores</label>
          <input id={sliderId} type="range" min={0} max={vals.length - 1} step={1}
            value={clamp(selected, 0, vals.length - 1)} aria-valuetext={`${label}, ${Math.round(vals[i])} out of 100, illustrative score`}
            onFocus={() => setHover(-1)}
            onChange={event => { setHover(-1); setSelected(Number(event.target.value)) }} />
          <output htmlFor={sliderId}>{label}: {Math.round(vals[i])} / 100</output>
          <span className="ib-example-note">Illustrative scores, not a live comparison</span>
        </div>
        <div style={{ marginTop: "auto" }}>
          <h3>{copy.title}</h3>
          <p>{copy.description}</p>
        </div>
      </div>
    </div>
  )
}



// event alias lives after the JSX so the 21st CLI tokenizer stays linear
type PointerSvgEv = React.PointerEvent<SVGSVGElement>
