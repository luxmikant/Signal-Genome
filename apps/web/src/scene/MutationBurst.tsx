import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGenome } from "../store.js";
import { helixPosition } from "./Helix.js";
import { GENES_MAP } from "../geneMeta.js";

type Particle = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  curve: THREE.CatmullRomCurve3;
  progress: number;
  speed: number;
  color: THREE.Color;
};

const COUNT = 90;

export function MutationBurst() {
  const notice = useGenome((s) => s.notices[0]);
  const particles = useRef<Particle[]>([]);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const lastTime = useRef(-1);

  useEffect(() => {
    if (!notice) return;
    if (notice.at === lastTime.current) return;
    lastTime.current = notice.at;

    const genes = useGenome.getState().genome?.genes ?? [];
    const targets: THREE.Vector3[] = [];
    for (const geneId of notice.geneIds.slice(0, 3)) {
      const g = genes.find((gene) => gene.geneId === geneId);
      if (!g) continue;
      const idx = genes.findIndex((gene) => gene.geneId === geneId);
      const total = genes.length;
      const pos = helixPosition(idx, "evidence", (idx / Math.max(1, total - 1)) * 2 - 1);
      targets.push(new THREE.Vector3(...pos));
    }
    if (targets.length === 0) return;

    const next: Particle[] = [];
    for (let i = 0; i < COUNT; i++) {
      const end = targets[i % targets.length]!;
      const angle = Math.random() * Math.PI * 2;
      const start = new THREE.Vector3(Math.cos(angle) * 7, -7, Math.sin(angle) * 4);
      const control = start.clone().lerp(end, 0.42 - Math.random() * 0.3);
      control.x += (Math.random() - 0.5) * 3;
      const curve = new THREE.CatmullRomCurve3([start, control, end]);
      const g = GENES_MAP[notice.geneIds[i % notice.geneIds.length] ?? ""];
      const color = new THREE.Color(g?.color ?? "#5eead4");
      next.push({ start, end, curve, progress: Math.random() * 0.3, speed: 0.9 + Math.random() * 0.8, color });
    }
    particles.current = next;
  }, [notice]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const inst = mesh.current;
    if (!inst) return;
    if (particles.current.length === 0) {
      inst.visible = false;
      return;
    }
    inst.visible = true;
    let alive = 0;
    for (let i = 0; i < particles.current.length; i++) {
      const p = particles.current[i]!;
      p.progress += delta * p.speed;
      if (p.progress >= 1) continue;
      alive += 1;
      const pos = p.curve.getPoint(p.progress);
      const fade = Math.sin(Math.min(1, p.progress) * Math.PI);
      dummy.position.copy(pos);
      dummy.scale.setScalar(0.12 * fade + 0.03);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      const color = p.color;
      inst.setColorAt(i, color);
    }
    inst.count = Math.min(COUNT, Math.max(alive, 0));
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    if (alive === 0) particles.current = [];
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}
