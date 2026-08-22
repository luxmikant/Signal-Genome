import { motion } from "framer-motion";
import { useGenome } from "../store.js";

export function NextDirectionCard() {
  const genome = useGenome((s) => s.genome);
  const select = useGenome((s) => s.select);
  const direction = genome?.direction;

  if (!direction) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, type: "spring", stiffness: 160, damping: 22 }}
      className="glass"
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 50,
        width: 320,
        padding: 16,
        cursor: "pointer",
      }}
      onClick={() => select(direction.geneId)}
    >
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#7df3a8", marginBottom: 8 }}>
        ◉ next best direction
      </div>
      <div style={{ fontWeight: 600, fontSize: 17, lineHeight: 1.25, marginBottom: 10 }}>{direction.headline}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {direction.reasons.map((r) => (
          <div key={r.label} style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
            <span style={{ color: "var(--faint)", fontFamily: "var(--mono)", fontSize: 10, width: 108, flexShrink: 0 }}>{r.label}</span>
            <span style={{ color: "var(--dim)", fontSize: 12, lineHeight: 1.4 }}>{r.detail}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
