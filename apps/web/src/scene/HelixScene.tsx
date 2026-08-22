import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Helix } from "./Helix.js";
import { Companion } from "./Companion.js";
import { MutationBurst } from "./MutationBurst.js";

export function HelixScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.8, 15], fov: 44, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={["#05070b"]} />
      <fog attach="fog" args={["#05070b", 20, 55]} />
      <Stars radius={70} depth={40} count={2600} factor={3.2} saturation={0.35} fade speed={0.6} />
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 4, 6]} intensity={60} color="#7df3a8" />
      <pointLight position={[-7, -3, -5]} intensity={70} color="#22d3ee" />
      <Helix />
      <Companion />
      <MutationBurst />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        enablePan={false}
        minDistance={6}
        maxDistance={26}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.72}
        autoRotate
        autoRotateSpeed={0.45}
      />
      <EffectComposer>
        <Bloom intensity={1.15} luminanceThreshold={0.18} luminanceSmoothing={0.9} mipmapBlur radius={0.7} />
        <Vignette eskil={false} offset={0.22} darkness={0.92} />
      </EffectComposer>
    </Canvas>
  );
}
