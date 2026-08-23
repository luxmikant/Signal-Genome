import { useState } from "react";
import { motion } from "framer-motion";
import { useGenome } from "../store.js";

const DEPTHS = [
  { id: "updated", label: "Just keep me updated", icon: "◉" },
  { id: "basics", label: "Teach me from fundamentals", icon: "π" },
  { id: "impl", label: "Show implementation-level material", icon: "⌘" },
  { id: "industry", label: "Track industry changes", icon: "≈" },
];

const SOURCE_TYPES = ["Engineering blogs", "Documentation", "Changelogs", "Talks & transcripts", "Community discussion"];

export function Onboarding() {
  const begin = useGenome((s) => s.begin);
  const connected = useGenome((s) => s.connected);
  const [depth, setDepth] = useState("basics");
  const [sources, setSources] = useState<string[]>(["Engineering blogs", "Documentation", "Changelogs"]);

  const toggleSource = (target: string): void => {
    setSources((prev) => (prev.includes(target) ? prev.filter((it) => it !== target) : [...prev, target]));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse 60% 45% at 50% 115%, rgba(245,185,66,0.28) 0%, transparent 70%), radial-gradient(ellipse 55% 40% at 18% 15%, rgba(124,58,237,0.12) 0%, transparent 70%), linear-gradient(180deg,#cfe4f7 0%,#eef4fa 55%,#f7f3e8 100%)",
        padding: 24,
        overflowY: "auto",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        style={{ maxWidth: 720, textAlign: "center" }}
      >
        <div className="status-pill" style={{ marginBottom: 26, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: connected ? "#2fbf71" : "#7c8fa0" }}>{connected ? "●" : "○"}</span>
          Signal City · the knowledge city is booting
        </div>

        <h1
          style={{
            fontSize: "clamp(34px, 6vw, 64px)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "#13222d",
            marginBottom: 14,
          }}
        >
          What do you want to{" "}
          <span style={{ background: "linear-gradient(90deg,#0f766e,#7c3aed)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            understand next?
          </span>
        </h1>
        <p style={{ color: "#45606f", fontSize: 16, maxWidth: 560, margin: "0 auto 34px", lineHeight: 1.5 }}>
          The web's knowledge about modern LLM inference becomes a living city — scraped by
          self-healing collectors, built into districts, roads and towers, and tuned to your interests.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          style={{ background: "var(--glass)", border: "1px solid var(--line)", borderRadius: 14, padding: 22, textAlign: "left", marginBottom: 16 }}
        >
          <div style={{ fontSize: 12, color: "var(--faint)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, fontFamily: "var(--mono)" }}>
            pick your amplification level
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {DEPTHS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDepth(d.id)}
                style={{
                  display: "flex", gap: 8, alignItems: "center",
                  padding: "10px 16px", borderRadius: 11, cursor: "pointer",
                  border: depth === d.id ? "1px solid rgba(15,118,110,0.55)" : "1px solid var(--line)",
                  background: depth === d.id ? "rgba(15,118,110,0.08)" : "var(--glass)",
                  color: depth === d.id ? "#0f766e" : "var(--dim)",
                  fontSize: 13.5, fontFamily: "var(--sans)", transition: "all .16s ease",
                }}
              >
                <span style={{ color: depth === d.id ? "#0f766e" : "var(--faint)" }}>{d.icon}</span>
                {d.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: "var(--faint)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "18px 0 12px", fontFamily: "var(--mono)" }}>
            where the evidence comes from
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {SOURCE_TYPES.map((s) => (
              <button
                key={s}
                onClick={() => toggleSource(s)}
                style={{
                  padding: "8px 14px", borderRadius: 999, cursor: "pointer",
                  border: sources.includes(s) ? "1px solid rgba(124,58,237,0.55)" : "1px solid var(--line)",
                  background: sources.includes(s) ? "rgba(124,58,237,0.07)" : "transparent",
                  color: sources.includes(s) ? "#7c3aed" : "var(--faint)",
                  fontSize: 12.5, fontFamily: "var(--sans)", transition: "all .16s ease",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={begin}
          style={{
            padding: "14px 34px", borderRadius: 13, cursor: "pointer",
            background: "linear-gradient(90deg,#0f766e,#7c3aed)",
            border: "none", fontSize: 16, fontWeight: 600,
            color: "#ffffff", fontFamily: "var(--sans)",
            boxShadow: "0 10px 40px rgba(15,118,110,0.3)",
          }}
        >
          Enter the city →
        </motion.button>
        <div style={{ marginTop: 18, color: "var(--faint)", fontSize: 12, fontFamily: "var(--mono)" }}>
          one prompt · one collector id · a self-healing pipeline
        </div>
      </motion.div>
    </div>
  );
}
