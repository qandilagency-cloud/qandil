"use client";

import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import SceneEnvironment from "./SceneEnvironment";
import Jellyfish from "./Jellyfish";

function VisibilityController() {
  const { gl, invalidate, setFrameloop } = useThree();

  useEffect(() => {
    const section = gl.domElement.closest("section");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setFrameloop(entry.isIntersecting ? "always" : "never");
        if (entry.isIntersecting) invalidate();
      },
      { threshold: 0.01 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [gl, invalidate, setFrameloop]);

  return null;
}

export default function Scene() {
  const tier = useDeviceTier();

  return (
    <Canvas
      dpr={[1, Math.min(1.5, tier.dpr[1])]}
      gl={{ antialias: tier.antialias, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 7.5], fov: 42, near: 0.1, far: 40 }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <VisibilityController />
      <SceneEnvironment />
      <ambientLight intensity={0.08} color={0x151c2b} />
      <hemisphereLight color={0x21d9ff} groundColor={0x070a12} intensity={0.2} />
      <rectAreaLight color={0xf4faff} intensity={10} width={1.1} height={7} position={[-3.2, 1.2, 4]} />
      <rectAreaLight color={0x21d9ff} intensity={8} width={0.8} height={6} position={[3.3, 0.4, 3.2]} />
      <rectAreaLight color={0xd5f74c} intensity={5.5} width={0.5} height={4.5} position={[2.2, -1.8, 2]} />
      <rectAreaLight color={0x875cff} intensity={7} width={4.5} height={0.7} position={[-2.2, -2.7, 2.5]} />
      <pointLight color={0xff719d} intensity={5} distance={7} decay={2} position={[-2.8, 0.2, 2.2]} />
      <Jellyfish />
    </Canvas>
  );
}
