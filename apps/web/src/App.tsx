import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HelixScene } from "./scene/HelixScene.js";
import { GenePanel } from "./panels/GenePanel.js";
import { NextDirectionCard } from "./panels/NextDirectionCard.js";
import { HealthView } from "./panels/HealthView.js";
import { Onboarding } from "./panels/Onboarding.js";
import { subscribeSse, useGenome } from "./store.js";
import { GENES_MAP } from "./geneMeta.js";

export function App() {
  const stage = useGenome((s) => s.stage);
  const genome = useGenome((s) => s.genome);
  const connected = useGenome((s) => s.connected);
  const openHealth = useGenome((s) => s.openHealth);
  const healthOpen = useGenome((s) => s.healthOpen);
  const notices = useGenome((s) => s.notices);

  useEffect(() => {
    const unsub = subscribeSse();
    return unsub;
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <HelixScene />

      {stage === "live" && (
        <>
          <TopHud totalItems={genome?.totalItems ?? 0} genes={genome?.genes.length ?? 0} connected={connected} onHealth={() => openHealth(!healthOpen)} />
          <div style={{ position: "fixed", top: 72, left: 16, zIndex: 50, display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 260 }}>
            {notices.slice(0, 3).map((n) => {
              const color = GENES_MAP[n.geneIds[0] ?? ""]?.color ?? "#5eead4";
              return (
                <motion.div
                  key={`${n.at}-${n.title}`}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass"
                  style={{ padding: "7px 11px", borderRadius: 10, fontSize: 11.5, color: "var(--dim)", maxWidth: "100%" }}
                >
                  <span style={{ color, fontFamily: "var(--mono)" }}>⌁ mutation</span> — {n.title.slice(0, 42)}
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {stage === "live" && <NextDirectionCard />}
      <GenePanel />
      <HealthView />

      <AnimatePresence>{stage === "intro" && <Onboarding />}</AnimatePresence>
    </div>
  );
}

function TopHud({ totalItems, genes, connected, onHealth }: { totalItems: number; genes: number; connected: boolean; onHealth: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        right: 16,
        zIndex: 55,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, pointerEvents: "auto" }}>
        <span
          style={{
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: "0.02em",
            background: "linear-gradient(90deg,#7df3a8,#22d3ee)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          SIGNAL GENOME
        </span>
        <span style={{ color: "var(--faint)", fontFamily: "var(--mono)", fontSize: 10.5 }}>LLM INFERENCE · v0.1</span>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", pointerEvents: "auto" }}>
        <span className="status-pill">{connected ? "● live" : "○ offline"}</span>
        <span className="status-pill">{genes} genes</span>
        <span className="status-pill">{totalItems} evidence pieces</span>
        <button className="hud-btn" onClick={onHealth}>⛑ source health</button>
      </div>
    </motion.div>
  );
}
