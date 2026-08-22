import { AnimatePresence, motion } from "framer-motion";
import { useGenome } from "../store.js";

const REACTIONS = [
  { id: "follow", label: "Follow this", icon: "✦" },
  { id: "teach-basics", label: "Teach me the foundations", icon: "◠" },
  { id: "already-know", label: "Already know this", icon: "✓" },
  { id: "not-for-me", label: "Not for me", icon: "✕" },
];

export function GenePanel() {
  const selected = useGenome((s) => s.selected);
  const detail = useGenome((s) => s.detail);
  const loading = useGenome((s) => s.detailLoading);
  const select = useGenome((s) => s.select);
  const react = useGenome((s) => s.react);
  const genome = useGenome((s) => s.genome);

  const geneView = genome?.genes.find((g) => g.geneId === selected) ?? null;

  return (
    <AnimatePresence>
      {selected && (
        <motion.aside
          key={selected}
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
          className="glass scroll-slim"
          style={{
            position: "fixed",
            top: 64,
            right: 16,
            bottom: 16,
            width: 368,
            zIndex: 60,
            padding: 20,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.14em", color: geneView?.color ?? "#8b93a7", textTransform: "uppercase" }}>
                gene:{selected}
              </div>
              <h2 style={{ fontSize: 24, marginTop: 2 }}>{detail?.gene.label ?? geneView?.label ?? "…"}</h2>
            </div>
            <button className="hud-btn" onClick={() => select(null)} style={{ fontSize: 16, padding: "4px 10px" }}>
              ✕
            </button>
          </div>

          {loading && <div style={{ color: "var(--faint)", fontSize: 13 }}>sequencing…</div>}

          {geneView && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Pill>{geneView.evidenceCount} sources</Pill>
              <Pill>momentum {(geneView.momentum * 100).toFixed(0)}%</Pill>
              <Pill color={geneView.color}>{geneView.maturity}</Pill>
              {geneView.followed && <Pill color="#7df3a8">followed</Pill>}
            </div>
          )}

          {detail && (
            <>
              <p style={{ color: "var(--dim)", fontSize: 14, lineHeight: 1.55, margin: 0 }}>
                {detail.gene.blurb}
              </p>

              {detail.gene.prerequisites.length > 0 && (
                <Section label="learn this first">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {detail.gene.prerequisites.map((p) => (
                      <span
                        key={p}
                        style={{
                          padding: "6px 12px", borderRadius: 9, cursor: "pointer",
                          border: "1px solid var(--line)", background: "var(--glass)",
                          fontSize: 12.5, color: "var(--dim)",
                        }}
                        onClick={() => select(p)}
                      >
                        {p} →
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              <Section label={`recent mutations (${detail.total})`}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {detail.timeline.slice(0, 8).map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "block", textDecoration: "none",
                        padding: "10px 12px", borderRadius: 11,
                        border: "1px solid var(--line)", background: "var(--glass)",
                        transition: "all .15s ease",
                      }}
                    >
                      <div style={{ color: "var(--ink)", fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 5, color: "var(--faint)", fontSize: 11, fontFamily: "var(--mono)" }}>
                        <span style={{ color: geneView?.color }}>{item.source}</span>
                        <span>·</span>
                        <span>{item.publishedAt}</span>
                      </div>
                      <div style={{ color: "var(--dim)", fontSize: 11.5, marginTop: 5, lineHeight: 1.45 }}>{item.excerpt}…</div>
                    </a>
                  ))}
                </div>
              </Section>
            </>
          )}

          <div style={{ marginTop: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {REACTIONS.map((r) => (
              <button
                key={r.id}
                className="hud-btn"
                style={{ flex: "1 1 46%", display: "flex", gap: 7, alignItems: "center", justifyContent: "center", fontSize: 11.5, padding: "9px 8px" }}
                onClick={() => react(selected, r.id)}
              >
                <span>{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Pill({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--mono)", fontSize: 11,
        padding: "4px 10px", borderRadius: 999,
        border: `1px solid ${color ?? "var(--line)"}`,
        color: color ?? "var(--dim)",
        background: "var(--glass)",
      }}
    >
      {children}
    </span>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--faint)", marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}
