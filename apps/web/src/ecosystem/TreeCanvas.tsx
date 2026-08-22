import { useEffect, useRef } from "react";
import {
  RING,
  bezierControl,
  computeTreeLayout,
  fieldSlot,
  type PlacedNode,
} from "@signal/ecosystem/tree";
import type { EcoSnapshot } from "@signal/ecosystem";
import { pathToRoot, useEco } from "./ecoStore.js";
import { CHAPTERS, camForChapter } from "./chapters.js";
import { useGenome } from "../store.js";

const VIOLET = "#7C5CFF";
const MINT = "#2EE6A8";
const INK = "#E8ECF4";
const DIM = "#8A93A6";
const CORE = "#12161F";
const BG = "#0B0E14";

type EdgeDraw = {
  from: PlacedNode;
  to: PlacedNode;
  relation: string;
  born: number;
};

type FieldDraw = { id: string; x: number; y: number; spd: number; stars: number; born: number };

/** Pre-rendered radial glow sprites, keyed by color + radius bucket. */
const glowCache = new Map<string, HTMLCanvasElement>();
function glowSprite(color: string, radius: number): HTMLCanvasElement {
  const key = `${color}:${Math.round(radius / 4)}`;
  const hit = glowCache.get(key);
  if (hit) return hit;
  const size = Math.max(16, Math.ceil(radius * 2.6));
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color + "55");
  grad.addColorStop(0.35, color + "22");
  grad.addColorStop(1, color + "00");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  glowCache.set(key, c);
  return c;
}

function nodeRadius(stars: number | null, isSeed: boolean): number {
  if (isSeed) return 13;
  return 4.5 + 2.1 * Math.log10(Math.max(stars ?? 30, 30));
}

export function TreeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = (): void => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    // ----- world state -----
    let layout = new Map<string, PlacedNode>();
    let edgesDraw: EdgeDraw[] = [];
    let fieldDraw: FieldDraw[] = [];
    const cam = { x: 0, y: 0, scale: 0.6 };
    let time = 0;
    let last = performance.now();
    const bursts: Array<{ t: number }> = [];
    const skyDots: Array<{ x: number; y: number; a: number }> = [];
    for (let i = 0; i < 90; i++) {
      const hash = (i * 2654435761) % 997;
      const ang = (i * Math.PI * (3 - Math.sqrt(5))) % (Math.PI * 2);
      const r = RING * (2.5 + (hash / 997) * 1.9);
      skyDots.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r * 0.8, a: 0.04 + (hash / 997) * 0.1 });
    }

    const rebuild = (snap: EcoSnapshot): void => {
      layout = computeTreeLayout(
        snap.lineage.nodes.map((n) => ({ id: n.id, born: n.dates.born })),
        snap.lineage.edges.map((e) => ({ from: e.from, to: e.to })),
      );
      edgesDraw = snap.lineage.edges.flatMap((e) => {
        const from = layout.get(e.from);
        const to = layout.get(e.to);
        if (!from || !to) return [];
        return [{ from, to, relation: e.relation, born: new Date(e.at).getTime() }];
      });
      const top = [...snap.field]
        .filter((n) => n.metrics)
        .sort((a, b) => (b.metrics?.stars ?? 0) - (a.metrics?.stars ?? 0))
        .slice(0, 30);
      fieldDraw = top.map((n, i) => {
        const slot = fieldSlot(i, RING * 3.3);
        return {
          id: n.id,
          x: slot.x,
          y: slot.y,
          spd: n.metrics?.starsPerDay ?? 0,
          stars: n.metrics?.stars ?? 0,
          born: new Date(n.metrics?.created ?? 0).getTime(),
        };
      });
    };

    const eco = useEco.getState();
    if (eco.data) rebuild(eco.data);
    const unsubData = useEco.subscribe((s, prev) => {
      if (s.data !== prev.data && s.data) rebuild(s.data);
    });
    const unsubGenome = useGenome.subscribe((s, prev) => {
      if (s.notices.length > prev.notices.length) bursts.push({ t: 0 });
    });

    // ----- interactions -----
    const s2w = (px: number, py: number): { x: number; y: number } => ({
      x: cam.x + (px - w / 2) / cam.scale,
      y: cam.y + (py - h / 2) / cam.scale,
    });
    const w2s = (x: number, y: number): { x: number; y: number } => ({
      x: w / 2 + (x - cam.x) * cam.scale,
      y: h / 2 + (y - cam.y) * cam.scale,
    });

    const hitTest = (px: number, py: number): string | null => {
      const p = s2w(px, py);
      const tol = 9 / cam.scale;
      let best: string | null = null;
      let bestD = Infinity;
      for (const [id, placed] of layout) {
        const node = useEco.getState().data?.lineage.nodes.find((n) => n.id === id);
        const r = nodeRadius(node?.stars ?? null, node?.kind === "seed") + tol;
        const d = Math.hypot(placed.x - p.x, placed.y - p.y);
        if (d < r && d < bestD) {
          bestD = d;
          best = id;
        }
      }
      for (const f of fieldDraw) {
        const d = Math.hypot(f.x - p.x, f.y - p.y);
        if (d < 12 / cam.scale && d < bestD) {
          bestD = d;
          best = f.id;
        }
      }
      return best;
    };

    const onMove = (e: PointerEvent): void => {
      const id = hitTest(e.clientX, e.clientY);
      useEco.getState().setHover(id, id ? { x: e.clientX, y: e.clientY } : undefined);
      canvas.style.cursor = id ? "pointer" : "default";
    };
    const onClick = (e: MouseEvent): void => {
      const id = hitTest(e.clientX, e.clientY);
      useEco.getState().focus(id);
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("click", onClick);

    // ----- frame loop -----
    let raf = 0;
    const frame = (now: number): void => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
      const state = useEco.getState();
      const scrubT = state.scrubT;

      // camera target
      let target = camForChapter(CHAPTERS[state.chapter] ?? CHAPTERS[0]!, layout, w, h);
      if (state.focusId) {
        const placed = layout.get(state.focusId);
        const field = fieldDraw.find((f) => f.id === state.focusId);
        if (placed) target = { x: placed.x, y: placed.y, scale: 1.55 };
        else if (field) target = { x: field.x, y: field.y, scale: 1.5 };
      }
      if (reduced) {
        cam.x = target.x;
        cam.y = target.y;
        cam.scale = target.scale;
      } else {
        const k = 1 - Math.exp(-dt * 2.6);
        cam.x += (target.x - cam.x) * k;
        cam.y += (target.y - cam.y) * k;
        cam.scale += (target.scale - cam.scale) * k;
      }
      cam.scale = Math.max(0.32, Math.min(cam.scale, 2.4));

      draw(ctx, {
        w, h, dpr, time, scrubT, state,
        layout, edgesDraw, fieldDraw, skyDots, cam, bursts,
        reduced, s2w, w2s,
      });
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("click", onClick);
      unsubData();
      unsubGenome();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        background: BG,
        cursor: "default",
        pointerEvents: "auto",
      }}
    />
  );
}

// ---------------------------------------------------------------------------

type DrawArgs = {
  w: number;
  h: number;
  dpr: number;
  time: number;
  scrubT: number | null;
  state: ReturnType<typeof useEco.getState>;
  layout: Map<string, PlacedNode>;
  edgesDraw: EdgeDraw[];
  fieldDraw: FieldDraw[];
  skyDots: Array<{ x: number; y: number; a: number }>;
  cam: { x: number; y: number; scale: number };
  bursts: Array<{ t: number }>;
  reduced: boolean;
  s2w: (x: number, y: number) => { x: number; y: number };
  w2s: (x: number, y: number) => { x: number; y: number };
};

function draw(ctx: CanvasRenderingContext2D, a: DrawArgs): void {
  const { w, h, dpr, cam, state } = a;
  const data = state.data;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) * 0.62);
  bg.addColorStop(0, "rgba(124,92,255,0.07)");
  bg.addColorStop(0.55, "rgba(124,92,255,0.02)");
  bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  if (!data) return;

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(cam.scale, cam.scale);
  ctx.translate(-cam.x, -cam.y);

  // ambient sky
  ctx.fillStyle = "#fff";
  for (const dot of a.skyDots) {
    ctx.globalAlpha = dot.a;
    ctx.fillRect(dot.x, dot.y, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;

  // field dust (scraped repos)
  for (const f of a.fieldDraw) {
    if (a.scrubT != null && f.born > a.scrubT) continue;
    const hot = Math.min(1, f.spd / 300);
    const r = 1.1 + hot * 2.6;
    ctx.globalAlpha = 0.14 + hot * 0.5;
    ctx.fillStyle = hot > 0.55 ? MINT : VIOLET;
    ctx.beginPath();
    ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
    ctx.fill();
    if (hot > 0.75) {
      const sprite = glowSprite(MINT, 14);
      ctx.globalAlpha = 0.5;
      ctx.drawImage(sprite, f.x - 14, f.y - 14, 28, 28);
    }
  }
  ctx.globalAlpha = 1;

  // edges
  const hovered = state.hoverId ?? state.focusId;
  const path = hovered && data ? new Set(pathToRoot(data, hovered)) : null;
  for (const e of a.edgesDraw) {
    const onPath = path ? path.has(e.from.id) && path.has(e.to.id) : false;
    const ghost = a.scrubT != null && e.born > a.scrubT;
    const cp = bezierControl(e.from, e.to);
    ctx.beginPath();
    ctx.moveTo(e.from.x, e.from.y);
    ctx.quadraticCurveTo(cp.x, cp.y, e.to.x, e.to.y);
    ctx.strokeStyle = onPath
      ? MINT
      : e.relation === "built-on"
        ? "rgba(124,92,255,0.5)"
        : e.relation === "inspired"
          ? "rgba(124,92,255,0.3)"
          : "rgba(138,147,166,0.22)";
    ctx.lineWidth = onPath ? 2.4 : e.relation === "built-on" ? 1.5 : 1.1;
    ctx.globalAlpha = ghost ? 0.12 : onPath ? 0.95 : 0.8;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // spores flowing down the lineage (live only)
  if (a.scrubT == null && !a.reduced && a.edgesDraw.length > 0) {
    ctx.fillStyle = MINT;
    for (let i = 0; i < a.edgesDraw.length; i++) {
      const e = a.edgesDraw[i]!;
      const t = (a.time * 0.045 + i / a.edgesDraw.length) % 1;
      const cp = bezierControl(e.from, e.to);
      const u = 1 - t;
      const x = u * u * e.from.x + 2 * u * t * cp.x + t * t * e.to.x;
      const y = u * u * e.from.y + 2 * u * t * cp.y + t * t * e.to.y;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(x, y, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // mutation bursts at the root (fed by the live genome scraper)
  const root = a.layout.get("the-agent-loop");
  if (root) {
    for (const b of a.bursts) {
      b.t += 1 / 60;
      const p = Math.min(b.t / 1.1, 1);
      ctx.strokeStyle = VIOLET;
      ctx.globalAlpha = (1 - p) * 0.7;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(root.x, root.y, 12 + p * 90, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = a.bursts.length - 1; i >= 0; i--) {
      if (a.bursts[i]!.t >= 1.1) a.bursts.splice(i, 1);
    }
  }
  ctx.globalAlpha = 1;

  // nodes
  const chapterNodes = new Set((CHAPTERS[state.chapter] ?? CHAPTERS[0]!).nodeIds);
  const focus = state.focusId;
  const hover = state.hoverId;
  for (const [id, placed] of a.layout) {
    const node = data.lineage.nodes.find((n) => n.id === id);
    if (!node) continue;
    const born = new Date(node.dates.born).getTime();
    const pruned = a.scrubT != null && born > a.scrubT;
    const isSeed = node.kind === "seed";
    const isSelf = node.id === "deepseek-harness";
    const active = focus === id || hover === id || chapterNodes.has(id);
    const r = nodeRadius(node.stars, isSeed);

    if (!pruned) {
      const sprite = glowSprite(active || isSeed ? VIOLET : VIOLET, r * 3.4);
      ctx.globalAlpha = active || isSeed ? 0.85 : 0.4;
      const gs = r * 7;
      ctx.drawImage(sprite, placed.x - gs / 2, placed.y - gs / 2, gs, gs);
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.arc(placed.x, placed.y, r, 0, Math.PI * 2);
    ctx.fillStyle = pruned ? "rgba(18,22,31,0.5)" : CORE;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(placed.x, placed.y, r, 0, Math.PI * 2);
    if (pruned) {
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "rgba(138,147,166,0.28)";
      ctx.lineWidth = 1;
    } else {
      ctx.setLineDash([]);
      ctx.strokeStyle = active ? MINT : isSelf ? MINT : isSeed ? VIOLET : "rgba(124,92,255,0.85)";
      ctx.lineWidth = active || isSelf ? 2 : 1.3;
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // living pulse for nodes with live metrics
    if (!pruned && !a.reduced && node.metrics && (node.metrics.starsPerDay ?? 0) > 40) {
      const pulse = r + 3 + Math.sin(a.time * 2 + placed.angle) * 1.6;
      ctx.strokeStyle = MINT;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(placed.x, placed.y, pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // the seed: a pure idea, orbited by thought
    if (isSeed && !pruned && !a.reduced) {
      ctx.fillStyle = VIOLET;
      for (let i = 0; i < 2; i++) {
        const ang = a.time * 0.9 + i * Math.PI;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(placed.x + Math.cos(ang) * (r + 9), placed.y + Math.sin(ang) * (r + 9), 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();

  // ----- screen-space labels -----
  const shouldLabel = (id: string, isField: boolean): boolean => {
    if (focus === id || hover === id) return true;
    if (!isField && (chapterNodes.has(id) || id === "the-agent-loop")) return true;
    if (!isField && cam.scale >= 1.15) return true;
    return false;
  };
  ctx.textBaseline = "middle";
  for (const [id, placed] of a.layout) {
    const node = data.lineage.nodes.find((n) => n.id === id);
    if (!node) continue;
    const born = new Date(node.dates.born).getTime();
    const pruned = a.scrubT != null && born > a.scrubT;
    if (!shouldLabel(id, false)) continue;
    const s = a.w2s(placed.x, placed.y);
    const r = nodeRadius(node.stars, node.kind === "seed");
    const lx = s.x + r * cam.scale + 10;
    const ly = s.y;
    if (lx > w - 190) continue;
    ctx.font = "600 11px 'JetBrains Mono', monospace";
    ctx.globalAlpha = pruned ? 0.3 : 0.92;
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.fillText(node.kind === "seed" ? "THE AGENT LOOP" : node.name, lx, ly - 7);
    if (node.id === "deepseek-harness" && !pruned) {
      ctx.fillStyle = MINT;
      ctx.font = "500 9px 'JetBrains Mono', monospace";
      ctx.fillText("⦿ renders this page", lx, ly + 8);
    } else if (node.stars != null) {
      ctx.fillStyle = DIM;
      ctx.font = "500 9px 'JetBrains Mono', monospace";
      const label = node.starsUncertain ? `~${Math.round(node.stars / 1000)}k★ · approx` : `${Math.round(node.stars / 1000)}k★`;
      ctx.fillText(label, lx, ly + 8);
    }
  }
  for (const f of a.fieldDraw) {
    if (focus !== f.id && hover !== f.id) continue;
    const s = a.w2s(f.x, f.y);
    ctx.font = "600 11px 'JetBrains Mono', monospace";
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.fillText(`${Math.round(f.stars / 1000)}k★ · +${f.spd.toFixed(0)}/day`, s.x + 12, s.y - 6);
  }
  ctx.globalAlpha = 1;
}
