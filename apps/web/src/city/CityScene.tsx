import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  districtOf,
  useCity,
  type CityBuilding,
  type CityModel,
} from "./cityStore.js";
import { Companion } from "../scene/Companion.js";

const SKY = "#d7e8f7";
const HORIZON = "#eaf3fb";
const INK = "#27455a";
const ROAD = "#ffffff";
const ROAD_EDGE = "#b9cfdf";
const AVENUE = "#ffffff";
const GOLD = "#f5b942";
const CORAL = "#ff6e6e";
const GRID = "#c4d7e6";

const FAMILY_CELLS: Record<string, [number, number]> = {
  attention: [-30, 11],
  memory: [-10, 11],
  serving: [10, 11],
  compute: [30, 11],
  compression: [-30, -11],
  routing: [-10, -11],
  scale: [10, -11],
  dynamics: [30, -11],
};

const GENE_OFFSETS: Record<string, [number, number]> = {
  attention: [0, 0],
  "kv-cache": [-3.6, 0.8],
  "paged-attention": [-1.2, 1.6],
  "prefix-caching": [1.2, 1.6],
  "long-context": [3.6, 0.8],
  "continuous-batching": [-1.8, 0],
  "serving-frameworks": [1.8, 0],
  quantization: [-1.8, 0],
  distillation: [1.8, 0],
  flashattention: [-1.8, 0],
  "gpu-kernels": [1.8, 0],
  "speculative-decoding": [0, 0],
  "moe-routing": [0, 0],
  "tensor-parallelism": [0, 0],
};

export function CityScene({ interactive = true }: { interactive?: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 88, 120], fov: 42, near: 0.1, far: 600 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: SKY }}
    >
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[HORIZON, 60, 200]} />
      <hemisphereLight args={["#ffffff", "#cfe0ee", 0.95]} />
      <directionalLight position={[40, 70, 30]} intensity={1.5} color="#fff7e8" />
      <directionalLight position={[-30, 20, -40]} intensity={0.35} color="#9ec3e8" />
      <CityWorld />
      {interactive && <Companion variant="city" />}
      <CameraRig />
      <EffectComposer>
        <Bloom intensity={0.32} luminanceThreshold={0.55} luminanceSmoothing={0.85} mipmapBlur radius={0.7} />
        <Vignette eskil={false} offset={0.18} darkness={0.42} />
      </EffectComposer>
    </Canvas>
  );
}

// ---------------------------------------------------------------------------

export function genePos(geneId: string, family: string): [number, number] {
  const cell = FAMILY_CELLS[family] ?? [0, 0];
  const [dx, dz] = GENE_OFFSETS[geneId] ?? [0, 0];
  return [cell[0] + dx, cell[1] + dz];
}

const AVENUE_X = (slot: number): number => -30 + slot * 12;

function landmarkPos(b: CityBuilding): [number, number] {
  if (b.avenueSlot !== undefined) return [AVENUE_X(b.avenueSlot), 0];
  const cell = FAMILY_CELLS[familyOf(b.geneId)] ?? [0, 0];
  const seed = Math.abs(hash33(b.id)) % 7;
  return [cell[0] + ((seed % 3) - 1) * 2.2, cell[1] + (seed < 3 ? -3.4 : -3.4)];
}

function familyOf(geneId: string): string {
  const model = useCity.getState().model;
  return model?.districts.find((d) => d.id === geneId)?.family ?? "attention";
}

function hash33(text: string): number {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
  return hash;
}

function slotPos(index: number): [number, number] {
  const col = index % 4;
  const row = Math.floor(index / 4);
  const jx = (((index * 2654435761) % 97) / 97 - 0.5) * 1.0;
  const jz = (((index * 40503) % 101) / 101 - 0.5) * 0.9;
  return [(col - 1.5) * 1.35 + jx, (row - 1.5) * 1.3 + jz];
}

function buildingColor(b: CityBuilding): THREE.Color {
  const model = useCity.getState().model;
  const d = model?.districts.find((x) => x.id === b.geneId);
  const base = new THREE.Color(d?.color ?? "#7aa7c8");
  base.offsetHSL(((hash33(b.id) % 5) - 2) * 0.012, 0.08, 0.02);
  if (b.archived) return base.multiplyScalar(0.55).lerp(new THREE.Color("#b9c6d2"), 0.55);
  const lit = base
    .clone()
    .lerp(new THREE.Color("#ffffff"), 0.22 + b.freshness * 0.38)
    .multiplyScalar(0.85 + b.freshness * 0.15);
  if (b.health === "failed") lit.lerp(new THREE.Color(CORAL), 0.25);
  return lit;
}

function makeWindowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#16303f";
  ctx.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 122; y += 12) {
    for (let x = 6; x < 58; x += 10) {
      const lit = (x * 7 + y * 13) % 5 < 3 ? 1 : 0.25;
      ctx.fillStyle = `rgba(255, 224, 150, ${lit})`;
      ctx.fillRect(x, y, 5, 7);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 6, 32, 32, 32);
  g.addColorStop(0, "rgba(10, 26, 38, 0.5)");
  g.addColorStop(1, "rgba(10, 26, 38, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

const BEACON_COLOR: Record<string, string> = {
  healthy: "#2fbf71",
  healing: "#f5a742",
  failed: "#ff6e6e",
  stale: "#9fb4c4",
};

function CityWorld() {
  const model = useCity((s) => s.model);
  const instRef = useRef<THREE.InstancedMesh>(null);
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const shadowRef = useRef<THREE.InstancedMesh>(null);
  const spireRef = useRef<THREE.InstancedMesh>(null);
  const mapRef = useRef<Array<CityBuilding | null>>([]);
  const hoverIdx = useRef(-1);

  const windowTexture = useMemo(() => makeWindowTexture(), []);
  const shadowTexture = useMemo(() => makeShadowTexture(), []);

  const hotId = useMemo(() => {
    if (!model) return null;
    let hot = model.districts[0]?.id ?? null;
    let best = -1;
    for (const d of model.districts) {
      if (d.momentum > best) {
        best = d.momentum;
        hot = d.id;
      }
    }
    return hot;
  }, [model]);

  useEffect(() => {
    const mesh = instRef.current;
    const core = coreRef.current;
    const shadow = shadowRef.current;
    const spire = spireRef.current;
    if (!mesh || !core || !shadow || !spire || !model) return;
    const all = model.buildings;
    const repos = all.filter((b) => b.kind === "repository");
    mesh.count = all.length;
    core.count = all.length;
    shadow.count = all.length;
    spire.count = repos.length;
    const dummy = new THREE.Object3D();
    const perGene = new Map<string, number>();
    let spireIdx = 0;
    all.forEach((b, i) => {
      let px: number, pz: number;
      if (b.kind === "repository") {
        [px, pz] = landmarkPos(b);
      } else {
        const di = model.districts.findIndex((d) => d.id === b.geneId);
        const gene = model.districts[di];
        const [gx, gz] = gene ? genePos(gene.id, gene.family) : [0, 0];
        const slot = perGene.get(b.geneId) ?? 0;
        perGene.set(b.geneId, slot + 1);
        const [lx, lz] = slotPos(slot);
        px = gx + lx;
        pz = gz + lz;
      }
      const isRepo = b.kind === "repository";
      const h = isRepo ? 0.9 + b.importance * 3.4 : 0.3 + b.importance * 1.15;
      const w = isRepo ? 1.35 : 0.95;

      dummy.position.set(px, h / 2, pz);
      dummy.scale.set(w, h, w);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, buildingColor(b));

      // lit-window facade core
      dummy.position.set(px, h / 2, pz);
      dummy.scale.set(w * 0.72, h * 0.98, w * 0.72);
      dummy.updateMatrix();
      core.setMatrixAt(i, dummy.matrix);
      const glow = b.archived ? 0.02 : 0.2 + b.freshness * 0.8;
      core.setColorAt(i, new THREE.Color(glow, glow, glow));

      // soft ground shadow
      dummy.position.set(px, 0.035, pz);
      dummy.scale.set(Math.max(1.2, w * 1.5), 1, Math.max(1.2, w * 1.5));
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      shadow.setMatrixAt(i, dummy.matrix);
      dummy.rotation.set(0, 0, 0);

      // landmark spire
      if (isRepo) {
        dummy.position.set(px, h + 0.5, pz);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        spire.setMatrixAt(spireIdx, dummy.matrix);
        spire.setColorAt(spireIdx, new THREE.Color(b.bridge ? "#f5b942" : "#ffffff"));
        spireIdx += 1;
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    core.instanceMatrix.needsUpdate = true;
    shadow.instanceMatrix.needsUpdate = true;
    spire.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (core.instanceColor) core.instanceColor.needsUpdate = true;
    if (spire.instanceColor) spire.instanceColor.needsUpdate = true;
    mapRef.current = all;
  }, [model, windowTexture, shadowTexture]);

  const paint = (idx: number): void => {
    const mesh = instRef.current;
    if (!mesh) return;
    if (hoverIdx.current >= 0 && mapRef.current[hoverIdx.current]) {
      mesh.setColorAt(hoverIdx.current, buildingColor(mapRef.current[hoverIdx.current]!));
    }
    hoverIdx.current = idx;
    const b = mapRef.current[idx];
    if (b) mesh.setColorAt(idx, new THREE.Color(GOLD));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  const onMove = (e: ThreeEvent<PointerEvent>): void => {
    const idx = e.instanceId ?? -1;
    const b = mapRef.current[idx] ?? null;
    useCity.getState().setHoverBuilding(b?.id ?? null);
    if (idx >= 0) paint(idx);
    document.body.style.cursor = b ? "pointer" : "default";
  };
  const onClick = (e: ThreeEvent<MouseEvent>): void => {
    const idx = e.instanceId ?? -1;
    const b = mapRef.current[idx];
    if (!b) return;
    const st = useCity.getState();
    if (b.kind === "repository") {
      st.selectBuilding(b);
      return;
    }
    if (st.district === b.geneId) st.selectBuilding(b);
    else st.focusDistrict(b.geneId);
  };

  if (!model) return null;

  return (
    <>
      <Ground />

      {model.districts.map((d) => {
        const [gx, gz] = genePos(d.id, d.family);
        return (
          <District
            key={d.id}
            id={d.id}
            x={gx}
            z={gz}
            hot={hotId === d.id}
            interactive={true}
          />
        );
      })}

      <instancedMesh
        ref={instRef}
        args={[undefined, undefined, 520]}
        frustumCulled={false}
        onPointerMove={onMove}
        onPointerOut={() => {
          useCity.getState().setHoverBuilding(null);
          paint(-1);
        }}
        onClick={onClick}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.55} metalness={0.12} />
      </instancedMesh>

      <instancedMesh ref={coreRef} args={[undefined, undefined, 520]} frustumCulled={false} raycast={() => null}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial map={windowTexture} toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={shadowRef} args={[undefined, undefined, 520]} frustumCulled={false} raycast={() => null}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadowTexture} transparent opacity={0.5} depthWrite={false} />
      </instancedMesh>

      <instancedMesh ref={spireRef} args={[undefined, undefined, 40]} frustumCulled={false} raycast={() => null}>
        <coneGeometry args={[0.16, 1, 6]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      <Avenue model={model} />
      <Roads model={model} />
    </>
  );
}

function Ground() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[160, 90, 1, 1]} />
        <meshLambertMaterial color="#eaf3fb" />
      </mesh>
      <gridHelper args={[160, 40, GRID, GRID]} position={[0, 0.01, 0]} />
      {/* main street strip along x */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <planeGeometry args={[120, 5.6, 1, 1]} />
        <meshLambertMaterial color={AVENUE} />
      </mesh>
      {[-5, 0, 5].map((z, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[0, 0.025, z]}>
          <planeGeometry args={[2.2, 0.16, 1, 1]} />
          <meshLambertMaterial color={GOLD} opacity={0.7} transparent />
        </mesh>
      ))}
    </group>
  );
}

function District({ id, x, z, hot, interactive }: { id: string; x: number; z: number; hot: boolean; interactive: boolean }) {
  const d = districtOf(useCity((s) => s.model), id);
  const focused = useCity((s) => s.district) === id;
  if (!d) return null;
  const dim = new THREE.Color(d.color).multiplyScalar(0.8).lerp(new THREE.Color("#ffffff"), 0.6);

  return (
    <group position={[x, 0, z]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} raycast={() => {}}>
        <ringGeometry args={[2.2, 3.1, 48]} />
        <meshBasicMaterial color={dim} transparent opacity={focused ? 0.65 : 0.4} />
      </mesh>
      {hot && <HotBeacon color={d.color} />}
      <mesh position={[0, 0.4, 2.6]} raycast={() => {}}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshBasicMaterial color={BEACON_COLOR[d.beacon]} />
      </mesh>
      {d.foundational && (
        <group raycast={() => {}}>
          <mesh position={[0, 1.8, -0.6]}>
            <boxGeometry args={[0.6, 3.4, 0.6]} />
            <meshBasicMaterial color={GOLD} />
          </mesh>
          <mesh position={[0, 3.7, -0.6]}>
            <coneGeometry args={[0.46, 1, 4]} />
            <meshBasicMaterial color={GOLD} />
          </mesh>
        </group>
      )}
      {d.emerging && interactive && <Crane x={-0.5} z={0.6} phase={x + z} color={d.color} districtId={d.id} />}
      <Html position={[0, 4.4, 0]} center distanceFactor={15} zIndexRange={[40, 0]} style={{ pointerEvents: "auto" }}>
        <button
          className={`city-label ${focused ? "is-focused" : ""}`}
          onClick={() => useCity.getState().focusDistrict(d.id)}
        >
          <span className="city-label-name">{d.label}</span>
          <span className="city-label-meta">
            {d.evidenceCount} items · {Math.round(d.momentum * 100)}%
          </span>
        </button>
      </Html>
    </group>
  );
}

function HotBeacon({ color }: { color: string }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const t = clock.elapsedTime;
    ring.current.scale.setScalar(1.2 + 0.35 * Math.sin(t * 2.2));
    const m = ring.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.45 + 0.3 * Math.sin(t * 2.2);
  });
  return (
    <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.05, 0]} raycast={() => {}}>
      <ringGeometry args={[4.1, 4.4, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.55} />
    </mesh>
  );
}

function Crane({ x, z, phase, color, districtId }: { x: number; z: number; phase: number; color: string; districtId: string }) {
  const arm = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useFrame((state) => {
    if (arm.current && !reduced) {
      arm.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.55 + phase * 1.7) * 0.35;
    }
  });
  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation();
        useCity.getState().focusDistrict(districtId);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[2.4, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <boxGeometry args={[0.15, 3.4, 0.15]} />
        <meshBasicMaterial color={hovered ? "#8a6a2f" : "#6d5830"} />
      </mesh>
      <group ref={arm} position={[0, 3.4, 0]}>
        <mesh position={[1.2, 0, 0]}>
          <boxGeometry args={[2.4, 0.09, 0.12]} />
          <meshBasicMaterial color="#8a6a2f" />
        </mesh>
        <mesh position={[2.4, 0, 0]}>
          <sphereGeometry args={[0.16, 10, 10]} />
          <meshBasicMaterial color={GOLD} />
        </mesh>
      </group>
      {hovered && (
        <Html center position={[0, 5, 0]} zIndexRange={[45, 0]} style={{ pointerEvents: "none" }}>
          <div className="city-crane-note">
            <span style={{ color }}>⛏ construction site</span>
            <span>fresh ideas are rising here — click</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function curvePoints(a: [number, number, number], b: [number, number, number], sag = 0.16): Array<[number, number, number]> {
  const mid: [number, number, number] = [(a[0] + b[0]) / 2, 0.5, (a[2] + b[2]) / 2];
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const dist = Math.hypot(dx, dz) || 1;
  const ox = (-dz / dist) * sag * dist;
  const oz = (dx / dist) * sag * dist;
  const c: [number, number, number] = [mid[0] + ox, 0.6, mid[2] + oz];
  const pts: Array<[number, number, number]> = [];
  for (let t = 0; t <= 1; t += 0.04) {
    const u = 1 - t;
    pts.push([
      u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
      u * u * a[2] + 2 * u * t * c[2] + t * t * b[2],
    ]);
  }
  return pts;
}

function straightPoints(a: [number, number, number], b: [number, number, number]): Array<[number, number, number]> {
  const pts: Array<[number, number, number]> = [];
  for (let t = 0; t <= 1; t += 0.05) {
    pts.push([a[0] + (b[0] - a[0]) * t, 0.12, a[2] + (b[2] - a[2]) * t]);
  }
  return pts;
}

function buildingGroundPos(model: CityModel, id: string): [number, number, number] | null {
  const b = model.buildings.find((x) => x.id === id);
  if (!b) return null;
  const [x, z] = landmarkPos(b);
  return [x, 0, z];
}

function Roads({ model }: { model: CityModel }) {
  const focusId = useCity((s) => s.district);
  const repos = model.buildings.filter((b) => b.kind === "repository");
  return (
    <>
      {model.roads
        .filter((r) => r.kind === "concept")
        .map((r, i) => {
          const ia = model.districts.findIndex((d) => d.id === r.from);
          const ib = model.districts.findIndex((d) => d.id === r.to);
          if (ia < 0 || ib < 0) return null;
          const da = model.districts[ia]!;
          const db = model.districts[ib]!;
          const [ax, az] = genePos(da.id, da.family);
          const [bx, bz] = genePos(db.id, db.family);
          const a: [number, number, number] = [ax, 0, az];
          const b: [number, number, number] = [bx, 0, bz];
          const lit = focusId === r.from || focusId === r.to;
          return (
            <Line
              key={`c-${r.from}-${r.to}-${i}`}
              points={curvePoints(a, b)}
              color={lit ? "#7c3aed" : "#9db8cb"}
              transparent
              opacity={lit ? 0.75 : 0.4}
              lineWidth={lit ? 1.8 : 1}
            />
          );
        })}
      {model.roads
        .filter((r) => r.kind === "repo")
        .map((r, i) => {
          const a = buildingGroundPos(model, r.from);
          const b = buildingGroundPos(model, r.to);
          if (!a || !b) return null;
          const lit = focusId === r.from || focusId === r.to;
          return (
            <Line
              key={`r-${r.from}-${r.to}-${i}`}
              points={straightPoints(a, b)}
              color={lit ? "#0f766e" : "#7f9cb2"}
              transparent
              opacity={lit ? 0.9 : 0.5}
              lineWidth={lit ? 2 : 1.2}
            />
          );
        })}
      <AvenueTraffic model={model} repos={repos} />
    </>
  );
}

function AvenueTraffic({ model, repos }: { model: CityModel; repos: CityBuilding[] }) {
  const group = useRef<THREE.Group>(null);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useFrame(({ clock }) => {
    if (!group.current || reduced) return;
    const t = clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      const speed = 0.55 + (repos[i % repos.length]?.growth ?? 0.3) * 0.9;
      const x = ((t * speed * 14 + i * 9) % 120) - 60;
      child.position.set(x, 0.35, 0);
    });
  });
  return (
    <group ref={group}>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.34, 8, 8]} />
          <meshBasicMaterial color="#0f766e" transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function Avenue({ model }: { model: CityModel }) {
  return (
    <group>
      {model.avenue.ends.map((end, i) => {
        const b = model.buildings.find((x) => x.id === end.id);
        if (!b) return null;
        const [x, , z] = buildingGroundPos(model, end.id) ?? [0, 0, 0];
        return (
          <group key={end.id} position={[x, 0, z]}>
            <EndCap color={i === 0 ? "#0f766e" : "#b45309"} />
            <Html center position={[0, 7.6, 0]} zIndexRange={[40, 0]} style={{ pointerEvents: "auto" }}>
              <button className="city-landmark-label" onClick={() => useCity.getState().selectBuilding(b)}>
                <span className="city-landmark-name">{end.label}</span>
                <span className="city-landmark-meta">{b.stars ? `${(b.stars / 1000).toFixed(0)}k ★` : "landmark"}</span>
              </button>
            </Html>
          </group>
        );
      })}
      {model.buildings
        .filter((b) => b.bridge)
        .map((b) => {
          const pos = buildingGroundPos(model, b.id);
          if (!pos) return null;
          return (
            <group key={b.id} position={pos}>
              <BridgeRing />
              <Html center position={[0, 5.6, 0]} zIndexRange={[40, 0]} style={{ pointerEvents: "auto" }}>
                <button className="city-bridge-label" onClick={() => useCity.getState().selectBuilding(b)}>
                  <span className="city-landmark-name">{b.title}</span>
                  <span className="city-landmark-meta">bridge · {b.stars ? `${(b.stars / 1000).toFixed(1)}k ★` : ""}</span>
                </button>
              </Html>
            </group>
          );
        })}
    </group>
  );
}

function EndCap({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.06, 0]} rotation-x={-Math.PI / 2} raycast={() => {}}>
      <ringGeometry args={[2.6, 3.1, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.55} />
    </mesh>
  );
}

function BridgeRing() {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const t = clock.elapsedTime;
    ring.current.scale.setScalar(1.15 + 0.18 * Math.sin(t * 2.6));
    const m = ring.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.5 + 0.25 * Math.sin(t * 2.6);
  });
  return (
    <mesh ref={ring} position={[0, 0.07, 0]} rotation-x={-Math.PI / 2} raycast={() => {}}>
      <ringGeometry args={[1.9, 2.15, 48]} />
      <meshBasicMaterial color={GOLD} transparent opacity={0.55} />
    </mesh>
  );
}

function CameraRig() {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();
  const lastKey = useRef("");
  const flightUntil = useRef(0);

  useFrame((state, dt) => {
    const s = useCity.getState();
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const key = `${s.scene}:${s.district ?? ""}:${s.building ? s.building.id : ""}`;
    if (key !== lastKey.current) {
      lastKey.current = key;
      flightUntil.current = state.clock.elapsedTime + 1.4;
    }
    const flying = !reduced && state.clock.elapsedTime < flightUntil.current;
    if (controls.current) controls.current.enabled = !flying;

    let wantPos = new THREE.Vector3(0, 64, 96);
    let wantTarget = new THREE.Vector3(0, 0, 0);
    if (s.building && s.model) {
      const b = s.model.buildings.find((x) => x.id === s.building?.id);
      if (b) {
        const [bx, , bz] = buildingGroundPos(s.model, b.id) ?? [0, 0, 0];
        wantTarget = new THREE.Vector3(bx, b.kind === "repository" ? 1.5 : 0, bz);
        wantPos = new THREE.Vector3(bx, 6.5, bz + 12);
      }
    } else if (s.district && s.model) {
      const d = s.model.districts.find((x) => x.id === s.district);
      if (d) {
        const [dx, dz] = genePos(d.id, d.family);
        wantTarget = new THREE.Vector3(dx, 0, dz);
        wantPos = new THREE.Vector3(dx, 8, dz + 16);
      }
    }
    const k = reduced ? 1 : 1 - Math.exp(-dt * 2);
    camera.position.lerp(wantPos, k);
    controls.current?.target.lerp(wantTarget, k);
    controls.current?.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={6}
      maxDistance={200}
      maxPolarAngle={Math.PI / 2 - 0.05}
      autoRotate
      autoRotateSpeed={0.3}
    />
  );
}
