import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { EcoNode } from "@signal/ecosystem";
import { TreeCanvas } from "./TreeCanvas.js";
import { CHAPTERS } from "./chapters.js";
import {
  capLabel,
  fmtDate,
  fmtStars,
  hotField,
  nodeById,
  parentEdgeOf,
  useEco,
} from "./ecoStore.js";

const VH = () => window.innerHeight;
const N = CHAPTERS.length;

export function EcoView() {
  const data = useEco((s) => s.data);
  const loading = useEco((s) => s.loading);
  const error = useEco((s) => s.error);
  const load = useEco((s) => s.load);

  const contentRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(0);
  const targetRef = useRef(0);
  const currentRef = useRef(0);

  useEffect(() => {
    void load();
  }, [load]);

  // ---------- smooth scroll physics ----------
  useEffect(() => {
    let raf = 0;
    let touchY: number | null = null;

    const apply = (): void => {
      const k = 1 - Math.exp(-(1 / 60) * 6.5);
      currentRef.current += (targetRef.current - currentRef.current) * k;
      if (Math.abs(targetRef.current - currentRef.current) < 0.5) {
        currentRef.current = targetRef.current;
      }
      setScroll(currentRef.current);
      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(${-currentRef.current}px)`;
      }
      const idx = Math.max(0, Math.min(N - 1, Math.round(currentRef.current / VH())));
      if (useEco.getState().chapter !== idx) useEco.getState().setChapter(idx);
      raf = requestAnimationFrame(apply);
    };
    raf = requestAnimationFrame(apply);

    const clamp = (v: number): number => Math.max(0, Math.min(v, (N - 1) * VH()));

    const onWheel = (e: WheelEvent): void => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-scrollable]")) return;
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? VH() : 1;
      targetRef.current = clamp(targetRef.current + e.deltaY * unit);
      e.preventDefault();
    };
    const onTouchStart = (e: TouchEvent): void => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent): void => {
      if (touchY == null) return;
      const y = e.touches[0]?.clientY ?? touchY;
      targetRef.current = clamp(targetRef.current + (touchY - y) * 1.6);
      touchY = y;
    };
    const onKey = (e: KeyboardEvent): void => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") targetRef.current = clamp(targetRef.current + VH());
      else if (e.key === "ArrowUp" || e.key === "PageUp") targetRef.current = clamp(targetRef.current - VH());
      else if (e.key === "Home") targetRef.current = 0;
      else if (e.key === "End") targetRef.current = (N - 1) * VH();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const jumpTo = (i: number): void => {
    targetRef.current = i * VH();
  };

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
      <TreeCanvas />

      {/* scrollable story content */}
      <div ref={contentRef} style={{ position: "absolute", inset: 0, willChange: "transform" }}>
        {CHAPTERS.map((ch, i) => (
          <ChapterSection key={ch.id} chapter={ch} index={i} />
        ))}
      </div>

      {loading && (
        <div className="eco-center-note">
          <span className="eco-pulse-dot" /> sequencing the ecosystem…
        </div>
      )}
      {error && (
        <div className="glass eco-error" style={{ pointerEvents: "auto" }}>
          <div className="eco-error-title">ecosystem offline</div>
          <p>{error}</p>
          <button
            className="hud-btn"
            onClick={() => {
              useEco.setState({ error: null });
              void load();
            }}
          >
            retry
          </button>
        </div>
      )}

      {data && (
        <>
          <ProgressRail onJump={jumpTo} />
          <Scrubber />
          <TrendsRail />
          <HoverCard />
          <DriftPanel />
          <div className="eco-hint">scroll to travel the lineage · hover a node · click to inspect its drift</div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ChapterSection({ chapter, index }: { chapter: (typeof CHAPTERS)[number]; index: number }) {
  const active = useEco((s) => s.chapter);
  const near = Math.abs(active - index) <= 1;
  const isHero = index === 0;
  const side = index % 2 === 0 ? "left" : "right";

  return (
    <section
      style={{
        height: "100vh",
        display: "flex",
        alignItems: isHero ? "center" : side === "left" ? "flex-start" : "flex-end",
        justifyContent: isHero ? "center" : side === "left" ? "flex-start" : "flex-end",
        padding: isHero ? "0 8vw" : side === "left" ? "22vh 6vw 0 5vw" : "22vh 5vw 0 6vw",
        pointerEvents: "none",
      }}
    >
      <motion.div
        initial={false}
        animate={{ opacity: near ? 1 : 0, y: near ? 0 : 24 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={isHero ? "eco-hero" : "eco-chapter"}
        style={{ pointerEvents: "auto" }}
      >
        <div className="eco-kicker">{chapter.kicker}</div>
        <h2 className={isHero ? "eco-hero-title" : "eco-chapter-title"}>{chapter.title}</h2>
        <p className={isHero ? "eco-hero-body" : "eco-chapter-body"}>{chapter.body}</p>
        {chapter.facts.length > 0 && (
          <div className="eco-facts">
            {chapter.facts.map((f) => (
              <span key={f.k} className="eco-fact">
                <span className="eco-fact-k">{f.k}</span>
                <span className="eco-fact-v">{f.v}</span>
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}

function ProgressRail({ onJump }: { onJump: (i: number) => void }) {
  const chapter = useEco((s) => s.chapter);
  const [showTitles, setShowTitles] = useState(false);
  return (
    <div
      className="eco-rail"
      onMouseEnter={() => setShowTitles(true)}
      onMouseLeave={() => setShowTitles(false)}
      style={{ pointerEvents: "auto" }}
    >
      {CHAPTERS.map((ch, i) => (
        <button key={ch.id} className="eco-rail-item" onClick={() => onJump(i)} title={ch.title}>
          <span className={`eco-rail-dot ${i === chapter ? "is-active" : ""}`} />
          {showTitles && (
            <span className={`eco-rail-label ${i === chapter ? "is-active" : ""}`}>{ch.kicker.split("·").pop()?.trim()}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function Scrubber() {
  const scrubT = useEco((s) => s.scrubT);
  const maxT = useEco((s) => s.maxT);
  const setScrubT = useEco((s) => s.setScrubT);
  const chapter = useEco((s) => s.chapter);
  const data = useEco((s) => s.data);

  const minT = useMemo(
    () => Math.min(...(data?.lineage.nodes.map((n) => new Date(n.dates.born).getTime()) ?? [0])),
    [data],
  );
  const value = scrubT ?? maxT;

  // chapter 7: auto-play the birth-order sweep once
  const playedRef = useRef(false);
  useEffect(() => {
    if (chapter !== 7 || playedRef.current) return;
    playedRef.current = true;
    setScrubT(minT);
    const step = (maxT - minT) / 320;
    const iv = window.setInterval(() => {
      const cur = useEco.getState().scrubT;
      if (cur == null) {
        window.clearInterval(iv);
        return;
      }
      if (cur + step >= maxT) {
        useEco.getState().setScrubT(null);
        window.clearInterval(iv);
      } else {
        useEco.getState().setScrubT(cur + step);
      }
    }, 40);
    return () => window.clearInterval(iv);
  }, [chapter, maxT, minT, setScrubT]);

  return (
    <div className="eco-scrub" style={{ pointerEvents: "auto" }}>
      <div className="eco-scrub-head">
        <span className="eco-scrub-title">the drift, in time</span>
        <button
          className={`eco-live-btn ${scrubT == null ? "is-live" : ""}`}
          onClick={() => setScrubT(null)}
        >
          {scrubT == null ? "● live" : "return to live"}
        </button>
      </div>
      <div className="eco-scrub-row">
        <span className="eco-scrub-date">{scrubT == null ? "now" : fmtDate(new Date(scrubT).toISOString())}</span>
        <input
          type="range"
          min={minT}
          max={maxT}
          step={86_400_000}
          value={value}
          onChange={(e) => setScrubT(Number(e.target.value))}
          aria-label="rewind the drift"
        />
        <span className="eco-scrub-date">{fmtDate(new Date(minT).toISOString())}</span>
      </div>
      <div className="eco-scrub-hint">drag to rewind — branches un-grow as you scrub back</div>
    </div>
  );
}

function TrendsRail() {
  const data = useEco((s) => s.data);
  const focus = useEco((s) => s.focus);
  const [open, setOpen] = useState(true);
  if (!data) return null;
  const top = hotField(data, 8);
  return (
    <div className="eco-trends" style={{ pointerEvents: "auto" }} data-scrollable>
      <button className="eco-trends-head" onClick={() => setOpen((o) => !o)}>
        <span className="eco-pulse-dot" />
        field pulse · top movers
        <span className="eco-trends-caret">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="eco-trends-list scroll-slim">
          {top.map((n, i) => (
            <button key={n.id} className="eco-trend" onClick={() => focus(n.id)}>
              <span className="eco-trend-rank">{i + 1}</span>
              <span className="eco-trend-name">
                {n.name}
                <span className="eco-trend-org">{n.org}</span>
              </span>
              <span className="eco-trend-right">
                <span className="eco-trend-stars">{fmtStars(n.stars)}★</span>
                <span className="eco-trend-spd">+{(n.metrics?.starsPerDay ?? 0).toFixed(0)}/d</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HoverCard() {
  const hoverId = useEco((s) => s.hoverId);
  const hoverPos = useEco((s) => s.hoverPos);
  const data = useEco((s) => s.data);
  const focusId = useEco((s) => s.focusId);
  if (!hoverId || !hoverPos || !data || focusId === hoverId) return null;
  const node = nodeById(data, hoverId);
  if (!node) return null;
  const x = hoverPos.x + 18 > window.innerWidth - 230 ? hoverPos.x - 248 : hoverPos.x + 18;
  const y = hoverPos.y + 18 > window.innerHeight - 110 ? hoverPos.y - 100 : hoverPos.y + 18;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.16 }}
      className="glass eco-hovercard"
      style={{ left: x, top: y }}
    >
      <div className="eco-hovercard-name">{node.name}</div>
      <div className="eco-hovercard-sub">
        {node.stars != null ? `${fmtStars(node.stars)}★` : "no repo"}
        {node.metrics ? ` · +${node.metrics.starsPerDay.toFixed(0)}/day` : ""}
        {node.kind === "seed" ? " · the idea itself" : ""}
      </div>
      <div className="eco-hovercard-hint">click for the drift</div>
    </motion.div>
  );
}

function DriftPanel() {
  const focusId = useEco((s) => s.focusId);
  const data = useEco((s) => s.data);
  const focus = useEco((s) => s.focus);
  const node = data && focusId ? nodeById(data, focusId) : null;
  return (
    <AnimatePresence>
      {node && data && (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="glass eco-drift"
          style={{ pointerEvents: "auto" }}
          data-scrollable
        >
          <button className="eco-close" onClick={() => focus(null)} aria-label="close">
            ✕
          </button>
          <div className="eco-drift-head">
            <div className="eco-drift-name">{node.name}</div>
            <div className="eco-drift-org">
              {node.org ?? "—"} · {node.kind}
              {node.id === "deepseek-harness" && <span className="eco-self-chip">⦿ renders this page</span>}
            </div>
          </div>

          {data.field.some((f) => f.id === node.id) ? <FieldDetail node={node} /> : <LineageDetail node={node} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LineageDetail({ node }: { node: EcoNode }) {
  const data = useEco((s) => s.data);
  if (!data) return null;
  const edge = parentEdgeOf(data, node.id);
  const parent = edge ? data.lineage.nodes.find((n) => n.id === edge.from) : null;

  const deltas = useMemo(() => {
    if (!parent) return [];
    const keys = new Set([...Object.keys(node.caps), ...Object.keys(parent.caps)]);
    return [...keys]
      .map((k) => ({ cap: k, delta: (node.caps[k] ?? 0) - (parent.caps[k] ?? 0) }))
      .filter((d) => d.delta !== 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 6);
  }, [node, parent]);

  return (
    <>
      {edge && (
        <div className="eco-relation">
          {edge.relation} <b>{parent?.name}</b> · {fmtDate(edge.at)}
          {edge.note && <span className="eco-relation-note"> — {edge.note}</span>}
        </div>
      )}
      <p className="eco-story">{node.story}</p>

      <div className="eco-factgrid">
        <Fact k="stars" v={node.stars != null ? `~${fmtStars(node.stars)}${node.starsUncertain ? " (approx)" : ""}` : "—"} />
        <Fact k="velocity" v={node.metrics ? `+${node.metrics.starsPerDay.toFixed(0)}/day` : "—"} />
        <Fact k="born" v={fmtDate(node.dates.born)} />
        <Fact k="lang" v={node.language ?? "—"} />
      </div>

      {node.dates.renames && node.dates.renames.length > 0 && (
        <div className="eco-renames">
          <div className="eco-section-title">the name drifted too</div>
          {node.dates.renames.map((r) => (
            <div key={`${r.from}-${r.to}`} className="eco-rename">
              <span className="eco-rename-names">
                {r.from} <span className="eco-rename-arrow">→</span> {r.to}
              </span>
              <span className="eco-rename-date">{fmtDate(r.at)}</span>
              <span className="eco-rename-reason">{r.reason}</span>
            </div>
          ))}
        </div>
      )}

      {parent && deltas.length > 0 && (
        <div className="eco-deltas">
          <div className="eco-section-title">
            drift vs {parent.name} <span className="eco-section-sub">capability axes</span>
          </div>
          {deltas.map((d) => {
            const note = node.drift?.find((nd) => nd.geneId === d.cap)?.note;
            return (
              <div key={d.cap} className="eco-delta">
                <div className="eco-delta-top">
                  <span className="eco-delta-label">{capLabel(d.cap)}</span>
                  <span className={d.delta > 0 ? "eco-delta-val up" : "eco-delta-val down"}>
                    {d.delta > 0 ? `+${d.delta}` : d.delta}
                  </span>
                </div>
                <div className="eco-delta-bar">
                  <span
                    className={d.delta > 0 ? "up" : "down"}
                    style={{ width: `${Math.min(100, (Math.abs(d.delta) / 3) * 100)}%` }}
                  />
                </div>
                {note && <div className="eco-delta-note">{note}</div>}
              </div>
            );
          })}
        </div>
      )}

      <div className="eco-sources">
        {node.sources.slice(0, 4).map((s) => (
          <a key={s} href={s} target="_blank" rel="noreferrer" className="eco-source">
            {s.replace(/^https?:\/\//, "").slice(0, 42)} ↗
          </a>
        ))}
        <span className={`eco-conf ${node.confidence}`}>{node.confidence}</span>
      </div>
    </>
  );
}

function FieldDetail({ node }: { node: EcoNode }) {
  const data = useEco((s) => s.data);
  return (
    <>
      <p className="eco-story">{node.story || "no description"}</p>
      <div className="eco-factgrid">
        <Fact k="stars" v={`${fmtStars(node.stars)}★`} />
        <Fact k="velocity" v={`+${(node.metrics?.starsPerDay ?? 0).toFixed(0)}/day`} />
        <Fact k="created" v={fmtDate(node.dates.born)} />
        <Fact k="pushed" v={node.metrics ? fmtDate(node.metrics.pushed) : "—"} />
      </div>
      {node.topics.length > 0 && (
        <div className="eco-topics">
          {node.topics.slice(0, 8).map((t) => (
            <span key={t} className="eco-topic">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="eco-sources">
        {node.github && (
          <a href={node.github} target="_blank" rel="noreferrer" className="eco-source">
            {node.github.replace(/^https?:\/\//, "")} ↗
          </a>
        )}
        <span className="eco-conf high">scraped live · {data?.fetchedAt ? fmtDate(data.fetchedAt) : ""}</span>
      </div>
    </>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="eco-factcell">
      <span className="eco-factcell-k">{k}</span>
      <span className="eco-factcell-v">{v}</span>
    </div>
  );
}
