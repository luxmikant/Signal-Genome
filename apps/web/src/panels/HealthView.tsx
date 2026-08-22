import { AnimatePresence, motion } from "framer-motion";
import { useGenome } from "../store.js";

const STATUS_COLOR: Record<string, string> = {
  healthy: "#7df3a8",
  healing: "#fbbf24",
  broken: "#fb7185",
  building: "#22d3ee",
  unbuilt: "#8b93a7",
};

export function HealthView() {
  const open = useGenome((s) => s.healthOpen);
  const health = useGenome((s) => s.health);
  const openHealth = useGenome((s) => s.openHealth);
  const harm = useGenome((s) => s.notices.length);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
          className="glass scroll-slim"
          style={{
            position: "fixed", top: 64, right: 16, bottom: 16, width: 380,
            zIndex: 60, padding: 20, overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h2 style={{ fontSize: 20 }}>Source health</h2>
            <button className="hud-btn" onClick={() => openHealth(false)} style={{ fontSize: 16, padding: "4px 10px" }}>✕</button>
          </div>
          <div style={{ color: "var(--faint)", fontSize: 12, marginBottom: 16, lineHeight: 1.5, fontFamily: "var(--mono)" }}>
            collectors are alive when the web changes under them — same c_* id, same schema
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--faint)", fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                <th style={{ paddingBottom: 8 }}>source</th>
                <th style={{ paddingBottom: 8 }}>status</th>
                <th style={{ paddingBottom: 8 }}>extracted</th>
                <th style={{ paddingBottom: 8 }}>collector</th>
              </tr>
            </thead>
            <tbody>
              {health?.map((row) => (
                <tr key={row.source} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px 0", fontWeight: 600 }}>{row.name ?? row.source}</td>
                  <td style={{ padding: "10px 0" }}>
                    <span style={{ color: STATUS_COLOR[row.status] ?? "#8b93a7", fontFamily: "var(--mono)", fontSize: 11 }}>
                      ● {row.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 0", fontFamily: "var(--mono)", color: "var(--dim)" }}>
                    {row.lastCount ?? "—"}
                  </td>
                  <td style={{ padding: "10px 0", fontFamily: "var(--mono)", color: "var(--faint)", fontSize: 11 }}>
                    {row.collectorId ?? "not built"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="glass" style={{ padding: 14, marginTop: 18, borderRadius: 12, borderStyle: "dashed" }}>
            <div style={{ color: "#7df3a8", fontFamily: "var(--mono)", fontSize: 11, marginBottom: 8 }}>how to heal, live:</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--dim)", lineHeight: 2 }}>
              <div>pnpm demo:break --source vllm-docs</div>
              <div>pnpm harness</div>
              <div style={{ color: "var(--faint)" }}># planner → validator → healer → same id</div>
            </div>
          </div>

          <div style={{ marginTop: 16, color: "var(--faint)", fontSize: 11, fontFamily: "var(--mono)" }}>
            mutations observed this session: {harm}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
