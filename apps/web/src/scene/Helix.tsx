import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGenome } from "../store.js";
import type { GeneView } from "../types.js";

const RADIUS = 3.6;
const SPREAD = 4.4;
const SPIN = 0.72;
const GENE_Z = 0.44;

export function helixPosition(index: number, strand: "evidence" | "interest", ySigma: number): [number, number, number] {
  const phase = index * SPIN;
  const offset = strand === "evidence" ? 0 : Math.PI;
  const angle = phase + offset;
  return [Math.cos(angle) * RADIUS * Math.max(0.55, Math.abs(Math.sin(phase))), ySigma * SPREAD, Math.sin(angle) * RADIUS];
}

export function Helix() {
  const genome = useGenome((s) => s.genome);

  const genes = useMemo(() => (genome?.genes ?? []).slice().sort((a, b) => a.y - b.y), [genome]);

  return (
    <group>
      {genes.map((gene, index) => (
        <GeneStrand key={gene.geneId} gene={gene} index={index} total={genes.length} />
      ))}
    </group>
  );
}

function GeneStrand({ gene, index, total }: { gene: GeneView; index: number; total: number }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Sprite>(null);
  const selected = useGenome((s) => s.selected === gene.geneId);
  const hovered = useGenome((s) => s.hovered === gene.geneId);
  const hover = useGenome((s) => s.hover);
  const select = useGenome((s) => s.select);

  const evidencePos = useMemo(() => helixPosition(index, "evidence", (index / Math.max(1, total - 1)) * 2 - 1), [index, total]);
  const interestPos = useMemo(() => helixPosition(index, "interest", (index / Math.max(1, total - 1)) * 2 - 1), [index, total]);
  const mid = useMemo(
    () => new THREE.Vector3((evidencePos[0] + interestPos[0]) / 2, (evidencePos[1] + interestPos[1]) / 2, (evidencePos[2] + interestPos[2]) / 2),
    [evidencePos, interestPos],
  );

  const labelTexture = useLabelTexture(`${gene.label} · ${gene.evidenceCount}`.toUpperCase(), gene.color);

  const ringRef = ring;
  const coreRef = core;

  useEffect(() => {
    const el = group.current;
    if (el) el.userData.geneId = gene.geneId;
  }, [gene.geneId]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = gene.hasPulse ? 1 + 0.14 * Math.sin(t * 5.5) : 1 + 0.05 * Math.sin(t * 2 + index);
    const size = (0.55 + gene.size * 0.85) * (selected || hovered ? 1.55 : 1) * pulse;
    if (coreRef.current) {
      coreRef.current.scale.setScalar(size);
      const m = coreRef.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = gene.momentum * (0.75 + 0.45 * Math.sin(t * 3.1 + index * 2));
    }
    if (ringRef.current) {
      const i = Math.max(0.05, gene.interest * 0.5 + 0.3);
      const s = i * (1 + 0.08 * Math.sin(t * 3.6 + index));
      ringRef.current.scale.setScalar(Math.max(0.001, s));
      ringRef.current.rotation.z = t * 0.7 + index;
    }
    if (halo.current) {
      const m = halo.current.material as THREE.SpriteMaterial;
      m.opacity = 0.36 + 0.25 * Math.sin(t * 3 + index) + gene.momentum * (selected || hovered ? 0.4 : 0.14);
    }
  });

  return (
    <group ref={group}>
      <group position={evidencePos}>
        <mesh
          ref={core}
          onPointerOver={(e) => {
            e.stopPropagation();
            hover(gene.geneId);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            hover(null);
            document.body.style.cursor = "auto";
          }}
          onClick={(e) => {
            e.stopPropagation();
            select(gene.geneId);
          }}
        >
          <sphereGeometry args={[0.42, 48, 48]} />
          <meshStandardMaterial
            color={gene.color}
            emissive={gene.color}
            emissiveIntensity={0.85}
            roughness={0.25}
            metalness={0.3}
            transparent
            opacity={0.95}
          />
        </mesh>
        <sprite ref={halo} scale={[2.6, 2.6, 1]}>
          <spriteMaterial
            map={haloTextureFor(gene.color)}
            transparent
            opacity={0.4}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      </group>

      <group position={mid}>
        <mesh
          ref={ringRef}
          rotation={[0, 0, 0]}
          onPointerOver={(e) => {
            e.stopPropagation();
            hover(gene.geneId);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            hover(null);
            document.body.style.cursor = "auto";
          }}
          onClick={(e) => {
            e.stopPropagation();
            select(gene.geneId);
          }}
          visible={gene.interest > 0}
        >
          <torusGeometry args={[0.9, 0.025, 12, 48]} />
          <meshBasicMaterial color={gene.interest >= 2 ? "#ffffff" : gene.color} toneMapped={false} transparent opacity={0.9} />
        </mesh>
      </group>

      <group position={interestPos}>
        <mesh visible={gene.followed}>
          <icosahedronGeometry args={[0.16, 0]} />
          <meshBasicMaterial color={gene.color} wireframe toneMapped={false} transparent opacity={0.85} />
        </mesh>
      </group>

      {gene.evidenceCount > 0 && (
        <sprite position={[evidencePos[0], evidencePos[1] - 0.85, evidencePos[2]]} scale={[3.4, 0.9, 1]}>
          <spriteMaterial map={labelTexture} transparent opacity={hovered || selected ? 0.95 : 0.55} depthWrite={false} />
        </sprite>
      )}

      <Rung evidencePos={evidencePos} interestPos={interestPos} color={gene.color} thickness={gene.interest * gene.size} />
    </group>
  );
}

function Rung({ evidencePos, interestPos, color, thickness }: { evidencePos: [number, number, number]; interestPos: [number, number, number]; color: string; thickness: number }) {
  const line = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(...evidencePos),
      new THREE.Vector3(...interestPos),
    ]);
    return curve.getPoints(12);
  }, [evidencePos, interestPos]);
  return (
    <line>
      <bufferGeometry setFromPoints={line} />
      <lineBasicMaterial color={color} transparent opacity={Math.min(0.85, 0.25 + thickness * 0.18)} toneMapped={false} />
    </line>
  );
}

const textureCache: Record<string, THREE.CanvasTexture> = {};

function haloTextureFor(hex: string): THREE.CanvasTexture {
  if (textureCache[hex]) return textureCache[hex];
  const tex = makeGlowTexture(hex);
  textureCache[hex] = tex;
  return tex;
}

function makeGlowTexture(hex: string): THREE.CanvasTexture {
  const key = hex;
  if (textureCache[key]) return textureCache[key];
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  const c = hex;
  g.addColorStop(0, c);
  g.addColorStop(0.35, hexToRgba(c, 0.5));
  g.addColorStop(1, hexToRgba(c, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  textureCache[key] = tex;
  return tex;
}

function makeLabelTexture(text: string, hex: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 512, 128);
  ctx.font = "600 34px 'Space Grotesk', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = hex;
  ctx.shadowBlur = 14;
  ctx.fillStyle = hex;
  ctx.fillText(text, 256, 64);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(text, 256, 64);
  return new THREE.CanvasTexture(canvas);
}

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function useLabelTexture(text: string, color: string): THREE.CanvasTexture {
  const key = `${text}|${color}`;
  return useMemo(() => {
    if (textureCache[key]) return textureCache[key];
    const tex = makeLabelTexture(text, color);
    textureCache[key] = tex;
    return tex;
  }, [key]);
}
