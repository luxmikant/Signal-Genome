import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  buildingsOf,
  CITY_RANGE,
  districtOf,
  fmtCityDate,
  fmtMonth,
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
    void useCity.getState().loadRising();
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

      <AnimatePresence>{scene === "arrival" && model && <Hero onEnter={enter} />}</AnimatePresence>

      {model && scene === "overview" && (
        <>
          <CityBreadcrumb />
          {activeDistrict && <DistrictCard district={activeDistrict} />}
          {activeDistrict?.emerging && <ConstructionNote district={activeDistrict} />}
          <HealthPanel model={model} />
          <RouteStrip model={model} />
          <TimeJourney />
          <Legend />
          <HoverPill />
          {building && <EvidenceDrawer building={building} />}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Hero({ onEnter }: { onEnter: () => void }) {
  const model = useCity((s) => s.model);
  if (!model) return null;
  const { stats } = model;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="city-hero"
    >
      <button className="city-hero-skip" onClick={onEnter}>
        skip story →
      </button>

      <section className="city-hero-section">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          <div className="city-hero-kicker">signal city · a story in three parts</div>
          <h1 className="city-hero-title">
            Your feed knows <em>what happened</em>.<br />
            It doesn't know <em>what matters</em>.
          </h1>
          <p className="city-hero-body">
            Every week, the important ideas about a fast-moving field are scattered across
            engineering blogs, documentation pages and changelogs. Feeds hand you the noise
            in chronological order — never the picture.
          </p>
          <div className="city-hero-chips">
            <span className="city-hero-chip">◔ fragmented signal</span>
            <span className="city-hero-chip">⤳ chronological, not educational</span>
            <span className="city-hero-chip">✂ scrapers that silently break</span>
          </div>
        </motion.div>
        <div className="city-hero-scrollhint">scroll ↓ the city is already growing behind this</div>
      </section>

      <section className="city-hero-section">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <div className="city-hero-kicker">part two · the idea</div>
          <h2 className="city-hero-title">
            So we built a <em>city</em> from the web's public knowledge.
          </h2>
          <p className="city-hero-body">
            A feed is a blur — a city, you can remember. Every building is one real source.
            Height is relevance. Lit windows are fresh evidence. Roads show how ideas depend
            on each other, and cranes mark what's rising.
          </p>
          <div className="city-hero-legend-row">
            <span><i className="city-hero-swatch" style={{ background: "#5b8def" }} /> buildings = sources</span>
            <span><i className="city-hero-swatch" style={{ background: "#ffd97a" }} /> lit windows = fresh evidence</span>
            <span><i className="city-hero-swatch" style={{ background: "#f5b942" }} /> cranes = emerging ideas</span>
            <span><i className="city-hero-swatch" style={{ background: "#ff6e6e" }} /> red = a broken source, never hidden</span>
          </div>
        </motion.div>
      </section>

      <section className="city-hero-section">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <div className="city-hero-kicker">part three · the organism</div>
          <h2 className="city-hero-title">
            And we taught it to <em>heal itself</em>.
          </h2>
          <p className="city-hero-body">
            When a site changes its layout, the collector goes dark — the harness notices,
            asks Scraper Studio to rewrite the extraction, and re-runs the <b>same collector ID</b>.
            Nothing downstream ever sees a gap. The city keeps its lights on.
          </p>
          <div className="city-arrival-stats">
            <span><b>{stats.totalItems}</b> evidence items</span>
            <span><b>{stats.sourcesHealthy}</b>/<b>{stats.sourcesTotal}</b> collectors healthy</span>
            <span><b>{model.districts.length}</b> districts</span>
            <span><b>{stats.newThisWeek}</b> new this week</span>
          </div>
        </motion.div>
      </section>

      <div className="city-hero-ctabar">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="city-enter-btn"
          onClick={onEnter}
        >
          Enter the city ↓
        </motion.button>
        <span className="city-hero-cta-hint">drag to orbit · click any building · press ▶ to watch it get built</span>
      </div>
    </motion.div>
  );
}

function ConstructionNote({ district }: { district: CityDistrict }) {
  const route = useCity((s) => s.model)?.route;
  const focus = useCity((s) => s.focusDistrict);
  const firstStep = route?.steps.find((st) => st.geneId !== district.id) ?? route?.steps[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="city-construction"
    >
      <span className="city-construction-ico">⛏</span>
      <div>
        <div className="city-construction-head">construction site · {district.label}</div>
        <div className="city-construction-body">
          {district.recentCount > 0
            ? `${district.recentCount} fresh sources this month, and the idea is still rising.`
            : "This idea is still under construction — the first bricks are arriving."}
          {firstStep && (
            <>
              {district.recentCount === 0 && ""}{" "}
              <button className="city-construction-link" onClick={() => focus(firstStep.geneId)}>
                learn {firstStep.label} first →
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TimeJourney() {
  const at = useCity((s) => s.at);
  const playing = useCity((s) => s.playing);
  const setAt = useCity((s) => s.setAt);
  const setPlaying = useCity((s) => s.setPlaying);
  const [pending, setPending] = useState<number | null>(null);

  const value = pending ?? at ?? CITY_RANGE.max;
  const stepMs = 30 * 86_400_000;

  const commit = (next: number): void => {
    if (next >= CITY_RANGE.max - 10 * 86_400_000) setAt(null);
    else setAt(next);
  };

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const current = useCity.getState().at ?? CITY_RANGE.max;
      const next = current + 30 * 86_400_000;
      if (next >= CITY_RANGE.max) {
        setPlaying(false);
        setAt(null);
      } else {
        setAt(next);
      }
    }, 800);
    return () => window.clearInterval(id);
  }, [playing, setAt, setPlaying]);

  return (
    <div className="city-scrub">
      <button
        className={`city-scrub-play ${playing ? "is-playing" : ""}`}
        onClick={() => setPlaying(!playing)}
        title="watch the city get built"
      >
        {playing ? "⏸" : "▶"}
      </button>
      <input
        type="range"
        min={CITY_RANGE.min}
        max={CITY_RANGE.max}
        step={stepMs}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          setPending(v);
          commit(v);
        }}
        onPointerUp={() => setPending(null)}
      />
      <span className="city-scrub-label">
        {at ? fmtMonth(at) : "now"} · build the city over time
      </span>
    </div>
  );
}

function HoverPill() {
  const hoverBuilding = useCity((s) => s.hoverBuilding);
  const model = useCity((s) => s.model);
  const b = useMemo(
    () => model?.buildings.find((x) => x.id === hoverBuilding) ?? null,
    [model, hoverBuilding],
  );
  return (
    <AnimatePresence>
      {b && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className="city-hoverpill"
        >
          <span className="city-hoverpill-title">{b.title}</span>
          <span className="city-hoverpill-meta">
            {b.source} · {b.sourceType} · {b.health} · dim builds whisper
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Legend() {
  return (
    <div className="city-legend">
      <div className="city-legend-head">reading the city</div>
      <div className="city-legend-items">
        <span className="city-legend-item"><i className="city-swatch" style={{ background: "#A7FF83" }} /> lit = fresh evidence</span>
        <span className="city-legend-item"><i className="city-swatch" style={{ background: "#FFB45B" }} /> hot ring = most active district</span>
        <span className="city-legend-item"><i className="city-swatch-ico">⛏</i> crane = emerging idea</span>
        <span className="city-legend-item"><i className="city-swatch" style={{ background: "#E8D9A8" }} /> monument = foundation</span>
        <span className="city-legend-item"><i className="city-swatch" style={{ background: "#4d5a52" }} /> dim = abandoned</span>
        <span className="city-legend-item"><i className="city-swatch" style={{ background: "#FF6E6E" }} /> red = broken source</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

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
  const isRepo = building.kind === "repository";
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="city-drawer"
    >
      <div className="city-drawer-tab">
        <span className="city-drawer-tab-k">{isRepo ? "landmark · repository" : "building · source"}</span>
        <button className="city-drawer-close" onClick={() => select(null)} aria-label="close">
          ✕
        </button>
      </div>
      <h2 className="city-drawer-title">{building.title}</h2>
      <div className="city-drawer-meta">
        {isRepo ? (
          <>
            <span>{building.org}</span>
            <span>{building.language}</span>
            {building.stars ? <span>{building.stars >= 1000 ? `${(building.stars / 1000).toFixed(1)}k ★` : `${building.stars} ★`}</span> : null}
            {building.growth !== undefined && <span>growth {Math.round(building.growth * 100)}%</span>}
            {building.bridge && <span style={{ color: "#b45309", fontWeight: 600 }}>bridge</span>}
          </>
        ) : (
          <>
            <span>{building.source}</span>
            <span>{building.sourceType}</span>
            <span>{building.publishedAt ? new Date(building.publishedAt).toLocaleDateString() : "no date"}</span>
            <span className={`city-beacon city-beacon-${building.health}`}>{building.health}</span>
            {building.archived && <span className="city-beacon city-beacon-stale">abandoned</span>}
          </>
        )}
        {d && <span style={{ color: d.color }}>{d.label}</span>}
      </div>
      <blockquote className="city-drawer-excerpt">“{building.excerpt}…”</blockquote>
      <div className="city-drawer-foot">
        {building.url && (
          <a className="city-source-link" href={building.url} target="_blank" rel="noreferrer">
            open the {isRepo ? "repository" : "source"} ↗
          </a>
        )}
        {!isRepo && (
          <span className="city-drawer-footnote">
            scraped {fmtCityDate(building.fetchedAt || Date.now())} · freshness {Math.round(building.freshness * 100)}%
          </span>
        )}
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
