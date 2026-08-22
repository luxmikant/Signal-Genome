import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import {
  districtOf,
  useCity,
  type CityBuilding,
  type CityModel,
} from "./cityStore.js";

const VOID = "#08110F";
const PHOSPHOR = "#A7FF83";
const GOLD = "#E8D9A8";
const EMBER = "#FFB45B";
const CORAL = "#FF6E6E";
const GRID = "#1E3931";
const RING_R = 26;

export function CityScene() {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 130, 150], fov: 40, near: 0.1, far: 600 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: VOID }}
    >
      <color attach="background" args={[VOID]} />
      <fog attach="fog" args={[VOID, 45, 170]} />
      <CityWorld />
      <CameraRig />
      <EffectComposer>
        <Bloom intensity={0.55} luminanceThreshold={0.18} luminanceSmoothing={0.8} mipmapBlur radius={0.7} />
        <Vignette eskil={false} offset={0.25} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  );
}

// ---------------------------------------------------------------------------

function districtPos(index: number, count: number): [number, number, number] {
  const a = (index / count) * Math.PI * 2 - Math.PI / 2;
  return [Math.cos(a) * RING_R, 0, Math.sin(a) * RING_R];
}

function slotPos(index: number): [number, number] {
  const col = index % 4;
  const row = Math.floor(index / 4);
  const jx = ((index * 2654435761) % 97) / 97 - 0.5;
  const jz = ((index * 40503) % 101) / 101 - 0.5;
  return [(col - 1.5) * 1.5 + jx * 0.9, (row - 1.5) * 1.5 + jz * 0.9];
}

function buildingColor(b: CityBuilding): THREE.Color {
  const model = useCity.getState().model;
  const d = model?.districts.find((x) => x.id === b.geneId);
  const base = new THREE.Color(d?.color ?? "#8A8C9B");
  if (b.archived) return base.clone().multiplyScalar(0.38).lerp(new THREE.Color("#8A8C9B"), 0.4);
  const lit = base.clone().lerp(new THREE.Color(PHOSPHOR), b.freshness * 0.8).multiplyScalar(0.62 + b.freshness * 0.5);
  if (b.health === "failed") lit.lerp(new THREE.Color(CORAL), 0.22);
  return lit;
}

const BEACON_COLOR: Record<string, string> = {
  healthy: PHOSPHOR,
  healing: EMBER,
  failed: CORAL,
  stale: "#56635a",
};

function CityWorld() {
  const model = useCity((s) => s.model);
  const instRef = useRef<THREE.InstancedMesh>(null);
  const mapRef = useRef<Array<CityBuilding | null>>([]);
  const hoverIdx = useRef(-1);

  // per-instance matrices + colors
  useEffect(() => {
    const mesh = instRef.current;
    if (!mesh || !model) return;
    const count = model.buildings.length;
    mesh.count = count;
    const dummy = new THREE.Object3D();
    const perDistrict = new Map<string, number>();
    model.buildings.forEach((b, i) => {
      const di = model.districts.findIndex((d) => d.id === b.geneId);
      const [cx, , cz] = districtPos(Math.max(0, di), model.districts.length);
      const slot = perDistrict.get(b.geneId) ?? 0;
      perDistrict.set(b.geneId, slot + 1);
      const [lx, lz] = slotPos(slot);
      const h = 0.35 + b.importance * 1.9;
      dummy.position.set(cx + lx, h / 2, cz + lz);
      dummy.scale.set(0.95, h, 0.95);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, buildingColor(b));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mapRef.current = model.buildings;
  }, [model]);

  const paint = (idx: number): void => {
    const mesh = instRef.current;
    if (!mesh) return;
    if (hoverIdx.current >= 0 && mapRef.current[hoverIdx.current]) {
      mesh.setColorAt(hoverIdx.current, buildingColor(mapRef.current[hoverIdx.current]!));
    }
    hoverIdx.current = idx;
    const b = mapRef.current[idx];
    if (b) mesh.setColorAt(idx, new THREE.Color(GOLD).lerp(new THREE.Color(PHOSPHOR), 0.25));
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
    if (st.district === b.geneId) st.selectBuilding(b);
    else st.focusDistrict(b.geneId);
  };

  if (!model) return null;

  return (
    <>
      <gridHelper args={[150, 30, GRID, "#12251f"]} position={[0, -0.01, 0]} />

      {model.districts.map((d, i) => (
        <District key={d.id} index={i} count={model.districts.length} id={d.id} />
      ))}

      <instancedMesh
        ref={instRef}
        args={[undefined, undefined, 260]}
        frustumCulled={false}
        onPointerMove={onMove}
        onPointerOut={() => {
          useCity.getState().setHoverBuilding(null);
          paint(-1);
        }}
        onClick={onClick}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffffff" />
      </instancedMesh>

      <Roads model={model} />
    </>
  );
}

// ---------------------------------------------------------------------------

function District({ index, count, id }: { index: number; count: number; id: string }) {
  const d = districtOf(useCity((s) => s.model), id);
  const focused = useCity((s) => s.district) === id;
  const [x, , z] = districtPos(index, count);

  if (!d) return null;
  const dim = new THREE.Color(d.color).multiplyScalar(0.55);

  return (
    <group position={[x, 0, z]}>
      {/* district plot */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} raycast={() => {}}>
        <ringGeometry args={[2.0, 4.4, 48]} />
        <meshBasicMaterial color={dim} transparent opacity={focused ? 0.55 : 0.3} />
      </mesh>
      {/* health beacon on the plot edge */}
      <mesh position={[0, 0.4, 3.3]} raycast={() => {}}>
        <sphereGeometry args={[0.34, 12, 12]} />
        <meshBasicMaterial color={BEACON_COLOR[d.beacon]} />
      </mesh>

      {d.foundational && (
        <group raycast={() => {}}>
          <mesh position={[0, 1.9, 0]}>
            <boxGeometry args={[0.66, 3.6, 0.66]} />
            <meshBasicMaterial color={GOLD} />
          </mesh>
          <mesh position={[0, 3.9, 0]}>
            <coneGeometry args={[0.5, 1.1, 4]} />
            <meshBasicMaterial color={GOLD} />
          </mesh>
        </group>
      )}

      {d.emerging && <Crane x={-0.4} z={0.4} phase={index} />}

      {/* district label */}
      <Html position={[0, 5.6, 0]} center distanceFactor={17} zIndexRange={[40, 0]}>
        <button
          className={`city-label ${focused ? "is-focused" : ""}`}
          onClick={() => useCity.getState().focusDistrict(d.id)}
          onMouseEnter={() => useCity.getState().setHoverBuilding(null)}
        >
          <span className="city-label-name">{d.label}</span>
          <span className="city-label-meta">
            {d.evidenceCount} items · {Math.round(d.momentum * 100)}% momentum
          </span>
        </button>
      </Html>
    </group>
  );
}

function Crane({ x, z, phase }: { x: number; z: number; phase: number }) {
  const arm = useRef<THREE.Group>(null);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useFrame((state) => {
    if (arm.current && !reduced) {
      arm.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.55 + phase * 1.7) * 0.35;
    }
  });
  return (
    <group position={[x, 0, z]} raycast={() => {}}>
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[0.16, 3.6, 0.16]} />
        <meshBasicMaterial color={GRID} />
      </mesh>
      <group ref={arm} position={[0, 3.6, 0]}>
        <mesh position={[1.3, 0, 0]}>
          <boxGeometry args={[2.6, 0.09, 0.13]} />
          <meshBasicMaterial color="#2A4A41" />
        </mesh>
        <mesh position={[2.6, 0, 0]}>
          <sphereGeometry args={[0.17, 10, 10]} />
          <meshBasicMaterial color={PHOSPHOR} />
        </mesh>
      </group>
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
  const c: [number, number, number] = [mid[0] + ox, 0.5, mid[2] + oz];
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

function Roads({ model }: { model: CityModel }) {
  const focusId = useCity((s) => s.district) ?? useCity((s) => s.hoverBuilding);
  return (
    <>
      {model.roads.map((r, i) => {
        const ia = model.districts.findIndex((d) => d.id === r.from);
        const ib = model.districts.findIndex((d) => d.id === r.to);
        if (ia < 0 || ib < 0) return null;
        const a = districtPos(ia, model.districts.length);
        const b = districtPos(ib, model.districts.length);
        const lit = focusId === r.from || focusId === r.to;
        return (
          <Line
            key={`${r.from}-${r.to}-${i}`}
            points={curvePoints(a, b)}
            color={lit ? PHOSPHOR : "#26443B"}
            transparent
            opacity={lit ? 0.9 : 0.45}
            lineWidth={lit ? 1.6 : 1}
          />
        );
      })}
    </>
  );
}

function CameraRig() {
  const controls = useRef<any>(null);
  const { camera } = useThree();
  const lastKey = useRef("");
  const flightUntil = useRef(0);

  useFrame((state, dt) => {
    const s = useCity.getState();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const key = `${s.scene}:${s.district ?? ""}`;
    if (key !== lastKey.current) {
      lastKey.current = key;
      flightUntil.current = state.clock.elapsedTime + 1.5;
    }
    const flying = !reduced && state.clock.elapsedTime < flightUntil.current;
    if (controls.current) controls.current.enabled = !flying;

    let wantPos = new THREE.Vector3(0, 55, 68);
    let wantTarget = new THREE.Vector3(0, 0, 0);
    if (s.district && s.model) {
      const di = s.model.districts.findIndex((d) => d.id === s.district);
      if (di >= 0) {
        const [cx, , cz] = districtPos(di, s.model.districts.length);
        const n = Math.hypot(cx, cz) || 1;
        wantTarget = new THREE.Vector3(cx * 0.8, 0, cz * 0.8);
        wantPos = new THREE.Vector3(cx * 0.8 - (cx / n) * 27, 15, cz * 0.8 - (cz / n) * 27);
      }
    }
    const k = reduced ? 1 : 1 - Math.exp(-dt * 1.9);
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
      minDistance={9}
      maxDistance={180}
      maxPolarAngle={Math.PI / 2 - 0.05}
      autoRotate
      autoRotateSpeed={0.35}
    />
  );
}