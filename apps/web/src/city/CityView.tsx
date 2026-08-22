import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  buildingsOf,
  districtOf,
  fmtCityDate,
  useCity,
  type CityBuilding,
  type CityDistrict,
} from "./cityStore.js";
import { CityScene } from "./CityScene.js";
import { useGenome } from "../store.js";

export function CityView() {
  const model = useCity((s) => s.model);
  const loading = useCity((s) => s.loading);
  const scene = useCity((s) => s.scene);
  const district = useCity((s) => s.district);
  const building = useCity((s) => s.building);
  const load = useCity((s) => s.load);
  const enter = useCity((s) => s.enter);

  useEffect(() => {
    void load();
  }, [load]);

  // live reload on genome mutations (new scraped evidence lands in the city)
  const noticesLen = useGenome((s) => s.notices.length);
  const lastNotices = useRef(noticesLen);
  useEffect(() => {
    if (noticesLen > lastNotices.current) {
      lastNotices.current = noticesLen;
      const t = window.setTimeout(() => void load(), 900);
      return () => window.clearTimeout(t);
    }
    lastNotices.current = noticesLen;
  }, [noticesLen, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== "Escape") return;
      const st = useCity.getState();
      if (st.building) st.selectBuilding(null);
      else if (st.district) st.focusDistrict(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeDistrict = districtOf(model, district);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
      <CityScene />

      {loading && !model && (
        <div className="city-center-note">
          <span className="city-pulse" /> drawing the city…
        </div>
      )}

      <AnimatePresence>{scene === "arrival" && model && <Arrival onEnter={enter} />}</AnimatePresence>

      {model && scene === "overview" && (
        <>
          <CityBreadcrumb />
          {activeDistrict && <DistrictCard district={activeDistrict} />}
          <HealthPanel model={model} />
          <RouteStrip model={model} />
          {building && activeDistrict && <EvidenceDrawer building={building} />}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Arrival({ onEnter }: { onEnter: () => void }) {
  const model = useCity((s) => s.model);
  if (!model) return null;
  const { stats } = model;
  const headline =
    stats.newThisWeek > 0
      ? `${stats.newThisWeek} new signals reshaped your inference map this week.`
      : "The city is quiet tonight — every building stands on collected evidence.";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      className="city-arrival"
    >
      <div className="city-arrival-inner">
        <div className="city-arrival-kicker">signal genome · {model.domain} district</div>
        <h1 className="city-arrival-title">
          The signal is <em>alive</em>.
        </h1>
        <p className="city-arrival-body">{headline}</p>
        <div className="city-arrival-stats">
          <span>
            <b>{stats.totalItems}</b> evidence items
          </span>
          <span>
            <b>{stats.sourcesHealthy}</b> of {stats.sourcesTotal} collectors healthy
          </span>
          <span>
            <b>{model.districts.length}</b> districts
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="city-enter-btn"
          onClick={onEnter}
        >
          Enter the city ↓
        </motion.button>
        <div className="city-arrival-hint">
          buildings are sources · height is relevance · lit windows are fresh evidence
        </div>
      </div>
    </motion.div>
  );
}

function CityBreadcrumb() {
  const district = useCity((s) => s.district);
  const d = districtOf(useCity((s) => s.model), district);
  return (
    <div className="city-breadcrumb">
      <span className="city-breadcrumb-domain">inference</span>
      {d && (
        <>
          <span className="city-breadcrumb-sep">/</span>
          <span style={{ color: d.color }}>{d.label}</span>
        </>
      )}
    </div>
  );
}

function DistrictCard({ district }: { district: CityDistrict }) {
  const model = useCity((s) => s.model);
  const focus = useCity((s) => s.focusDistrict);
  const blds = useMemo(() => buildingsOf(model, district.id), [model, district.id]);
  const fresh = blds.filter((b) => b.freshness > 0.35).length;
  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="city-district-card"
    >
      <div className="city-district-head">
        <span className="city-district-dot" style={{ background: district.color }} />
        <span className="city-district-name">{district.label}</span>
        <span className="city-district-family">{district.family}</span>
        <span className={`city-beacon city-beacon-${district.beacon}`}>{district.beacon}</span>
      </div>
      <p className="city-district-blurb">{district.blurb}</p>
      <div className="city-district-meters">
        <div className="city-meter">
          <span className="city-meter-k">momentum</span>
          <span className="city-meter-bar">
            <span style={{ width: `${Math.round(district.momentum * 100)}%`, background: district.color }} />
          </span>
          <span className="city-meter-v">{Math.round(district.momentum * 100)}%</span>
        </div>
        <div className="city-meter">
          <span className="city-meter-k">fresh items</span>
          <span className="city-meter-v">{fresh} of {blds.length}</span>
        </div>
      </div>
      <div className="city-district-actions">
        <button className="city-action" onClick={() => focus(null)}>
          ← back to the city
        </button>
        <span className="city-district-evidence">{district.evidenceCount} items</span>
      </div>
    </motion.div>
  );
}

function EvidenceDrawer({ building }: { building: CityBuilding }) {
  const select = useCity((s) => s.selectBuilding);
  const d = districtOf(useCity((s) => s.model), building.geneId);
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="city-drawer"
    >
      <div className="city-drawer-tab">
        <span className="city-drawer-tab-k">building · source</span>
        <button className="city-drawer-close" onClick={() => select(null)} aria-label="close">
          ✕
        </button>
      </div>
      <h2 className="city-drawer-title">{building.title}</h2>
      <div className="city-drawer-meta">
        <span>{building.source}</span>
        <span>{building.sourceType}</span>
        <span>{building.publishedAt ? new Date(building.publishedAt).toLocaleDateString() : "no date"}</span>
        <span className={`city-beacon city-beacon-${building.health}`}>{building.health}</span>
        {d && <span style={{ color: d.color }}>{d.label}</span>}
      </div>
      <blockquote className="city-drawer-excerpt">“{building.excerpt}…”</blockquote>
      <div className="city-drawer-foot">
        {building.url && (
          <a className="city-source-link" href={building.url} target="_blank" rel="noreferrer">
            open the source ↗
          </a>
        )}
        <span className="city-drawer-footnote">
          scraped {fmtCityDate(building.fetchedAt || Date.now())} · freshness {Math.round(building.freshness * 100)}%
        </span>
      </div>
    </motion.div>
  );
}

function HealthPanel({ model }: { model: NonNullable<ReturnType<typeof useCity.getState>["model"]> }) {
  const { stats } = model;
  const beacons = [
    { label: "healthy", count: stats.sourcesHealthy, cls: "city-beacon-healthy" },
    { label: "healing", count: stats.sourcesHealing + stats.sourcesBroken, cls: "city-beacon-healing" },
  ];
  return (
    <div className="city-health">
      <div className="city-health-head">system · collectors</div>
      <div className="city-health-row">
        {beacons.map((b) => (
          <span key={b.label} className="city-health-item">
            <span className={`city-beacon ${b.cls}`} />
            <b>{b.count}</b> {b.label}
          </span>
        ))}
        <span className="city-health-item">
          <b>{model.stats.totalItems}</b> items
        </span>
      </div>
      <div className="city-health-foot">
        last collection {fmtCityDate(stats.lastCollectionAt)} · failures stay visible, never hidden
      </div>
    </div>
  );
}

function RouteStrip({ model }: { model: NonNullable<ReturnType<typeof useCity.getState>["model"]> }) {
  const focus = useCity((s) => s.focusDistrict);
  const route = model.route;
  if (!route) return null;
  return (
    <div className="city-route">
      <div className="city-route-head">
        <span className="city-route-kicker">learn this next</span>
        <span className="city-route-headline">{route.headline}</span>
      </div>
      <div className="city-route-steps">
        {route.steps.map((st, i) => (
          <button
            key={st.geneId}
            className={`city-route-step ${i === route.steps.length - 1 ? "is-target" : ""}`}
            onClick={() => focus(st.geneId)}
            title={st.blurb}
          >
            <span className="city-route-idx">{String(i + 1).padStart(2, "0")}</span>
            <span>{st.label}</span>
          </button>
        ))}
        <span className="city-route-cta">click a step to fly there</span>
      </div>
    </div>
  );
}