import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useGenome } from "../store.js";

const EXCITEMENTS = [
  "ooh, new evidence!",
  "mutation landed!",
  "the city grew!",
  "the web said something new!",
  "followed. lighting it up!",
  "something new just arrived…",
];

const VARIANTS = {
  orbit: { home: [0, 2.2, 5.4] as const, scale: 1.25, drift: 1.1, float: 0.32 },
  city: { home: [0, 24, 0] as const, scale: 9, drift: 4.5, float: 1.6 },
};

export function Companion({ variant = "orbit" }: { variant?: "orbit" | "city" }) {
  const group = useRef<THREE.Group>(null);
  const blob = useRef<THREE.Mesh>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const cfg = VARIANTS[variant];

  const hovered = useGenome((s) => s.hovered);
  const notice = useGenome((s) => s.notices[0]);
  const excitement = useRef(0);
  const lastNoticeId = useRef<string | null>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    if (notice && notice.at !== Number(lastNoticeId.current)) {
      lastNoticeId.current = String(notice.at);
      excitement.current = 1;
    }

    if (group.current) {
      const float = Math.sin(t * 0.7) * cfg.float;
      const drift = Math.sin(t * 0.23) * cfg.drift;
      const home = cfg.home;
      group.current.position.lerp(
        new THREE.Vector3(drift, home[1] + float, home[2]),
        Math.min(1, delta * 2.4),
      );
      group.current.rotation.y = Math.sin(t * 0.4) * 0.5;
    }

    if (blob.current) {
      excitement.current = THREE.MathUtils.lerp(excitement.current, 0, delta * 2.2);
      const bounce = 1 + excitement.current * 0.16 * Math.abs(Math.sin(t * 16));
      blob.current.scale.set(0.9 * bounce, 0.78 * bounce, 0.9 * bounce);
      const m = blob.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.35 + excitement.current * 1.3 * Math.abs(Math.sin(t * 24));
    }

    const look = hovered;
    const eyeDir = look ? Math.sin(t * 0.8) * 0.4 : 0;
    if (eyeL.current) eyeL.current.position.set(-0.11 + eyeDir * 0.05, 0.02, 0.19);
    if (eyeR.current) eyeR.current.position.set(0.11 + eyeDir * 0.05, 0.02, 0.19);
  });

  const bubbleText = notice && Date.now() - notice.at < 4800 ? notice.title : null;

  return (
    <group ref={group} position={cfg.home as unknown as [number, number, number]} scale={cfg.scale}>
      <mesh ref={blob}>
        <sphereGeometry args={[0.5, 48, 48]} />
        <MeshDistortMaterial
          color="#5eead4"
          distort={0.36}
          speed={1.6}
          roughness={0.22}
          metalness={0.18}
          emissive="#14b8a6"
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh ref={eyeL} position={[-0.11, 0.02, 0.19]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshBasicMaterial color="#04121a" toneMapped={false} />
      </mesh>
      <mesh ref={eyeR} position={[0.11, 0.02, 0.19]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshBasicMaterial color="#04121a" toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.16, 0.44]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#04121a" toneMapped={false} />
      </mesh>
      {bubbleText && (
        <Html center position={[0, 0.85, 0]} zIndexRange={[50, 0]} style={{ pointerEvents: "none" }}>
          <CompanionBubble text={bubbleText} />
        </Html>
      )}
    </group>
  );
}

import { motion } from "framer-motion";

function CompanionBubble({ text }: { text: string }) {
  const pickup = EXCITEMENTS[Math.abs(hash(text)) % EXCITEMENTS.length] ?? "mutation!";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.92 }}
      transition={{ duration: 0.25 }}
      style={{
        position: "relative",
        top: "-38px",
        width: "max-content",
        maxWidth: 300,
        padding: "9px 14px",
        borderRadius: 14,
        background: "rgba(255, 255, 255, 0.94)",
        border: "1px solid rgba(15, 118, 110, 0.35)",
        color: "#13222d",
        fontSize: 12.5,
        lineHeight: "1.35",
        fontFamily: "var(--sans)",
        boxShadow: "0 8px 30px rgba(19, 34, 45, 0.16)",
      }}
    >
      <span style={{ color: "#0f766e", fontWeight: 600 }}>plasmi:</span> {pickup}
      <div style={{ opacity: 0.65, marginTop: 2, fontStyle: "italic" }}>“{text.slice(0, 64)}”</div>
    </motion.div>
  );
}

function hash(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h;
}
