import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CityView } from "./city/CityView.js";
import { Onboarding } from "./panels/Onboarding.js";
import { subscribeSse, useGenome } from "./store.js";
import { useCity } from "./city/cityStore.js";

export function App() {
  const stage = useGenome((s) => s.stage);
  const connected = useGenome((s) => s.connected);

  useEffect(() => {
    const unsub = subscribeSse();
    return unsub;
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      {stage === "live" && <CityView />}

      {stage === "live" && <TopHud connected={connected} />}

      <AnimatePresence>{stage === "intro" && <Onboarding />}</AnimatePresence>
    </div>
  );
}

function TopHud({ connected }: { connected: boolean }) {
  const rising = useCity((s) => s.rising);
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
            background: "linear-gradient(90deg,#0f766e,#7c3aed)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          SIGNAL CITY
        </span>
        <span style={{ color: "var(--faint)", fontFamily: "var(--mono)", fontSize: 10.5 }}>the knowledge city that never goes dark · v0.4</span>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", pointerEvents: "auto" }}>
        <span className="status-pill">{connected ? "● live · self-healing" : "○ offline"}</span>
        {rising.map((r) => (
          <span key={r.geneId} className="status-pill city-rising">
            ▲ {r.label} +{r.deltaPct}%
          </span>
        ))}
      </div>
    </motion.div>
  );
}
