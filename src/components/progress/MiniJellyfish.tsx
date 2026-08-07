"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildBellGeometry } from "@/components/scene/jellyfishGeometry";

const CHROME_BLUE = "#151c2b";
const CHROME_DARK = "#070a12";

type MiniJellyfishProps = {
  active: boolean;
};

export default function MiniJellyfish({ active }: MiniJellyfishProps) {
  const groupRef = useRef<THREE.Group>(null);
  const legsRef = useRef<THREE.Group>(null);
  const bellData = useMemo(() => buildBellGeometry(14, 24, 19), []);

  const bellMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(CHROME_BLUE),
        metalness: 1,
        roughness: 0.24,
        clearcoat: 1,
        clearcoatRoughness: 0.18,
        iridescence: 0.65,
        iridescenceIOR: 1.35,
        iridescenceThicknessRange: [180, 850],
        envMapIntensity: 1.8,
        transparent: false,
        opacity: 1,
        transmission: 0,
        depthWrite: true,
        depthTest: true,
      }),
    []
  );

  const legMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(CHROME_DARK),
        metalness: 0.95,
        roughness: 0.28,
        clearcoat: 0.8,
        envMapIntensity: 1.5,
      }),
    []
  );

  const legs = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const angle = (index / 7) * Math.PI * 2;
        const radius = index % 2 === 0 ? 0.46 : 0.33;
        const length = index % 3 === 0 ? 1.35 : 1.05;
        const points = [
          new THREE.Vector3(Math.cos(angle) * radius, -0.38, Math.sin(angle) * radius),
          new THREE.Vector3(Math.cos(angle) * radius * 0.86, -0.75, Math.sin(angle) * radius * 0.86),
          new THREE.Vector3(Math.cos(angle + 0.22) * radius, -length, Math.sin(angle + 0.22) * radius),
        ];
        const curve = new THREE.CatmullRomCurve3(points);
        return {
          geometry: new THREE.TubeGeometry(curve, 8, index % 2 === 0 ? 0.045 : 0.065, 5, false),
          phase: index * 0.78,
        };
      }),
    []
  );

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    const legsGroup = legsRef.current;
    if (!group || !legsGroup) return;

    const target = active ? Math.sin(clock.elapsedTime * 8) * 0.1 : 0;
    legsGroup.rotation.y = THREE.MathUtils.damp(legsGroup.rotation.y, target, 8, delta);
    group.rotation.y += delta * (active ? 0.45 : 0.12);
    legsGroup.children.forEach((leg, index) => {
      leg.rotation.z = THREE.MathUtils.damp(
        leg.rotation.z,
        active ? Math.sin(clock.elapsedTime * 9 + legs[index].phase) * 0.08 : 0,
        10,
        delta
      );
    });
  });

  useEffect(
    () => () => {
      bellData.geometry.dispose();
      legs.forEach(({ geometry }) => geometry.dispose());
      bellMaterial.dispose();
      legMaterial.dispose();
    },
    [bellData, bellMaterial, legMaterial, legs]
  );

  return (
    <group ref={groupRef} position={[0, 0.35, 0]} scale={0.9}>
      <mesh geometry={bellData.geometry} material={bellMaterial} />
      <group ref={legsRef}>
        {legs.map(({ geometry }, index) => (
          <mesh key={index} geometry={geometry} material={legMaterial} />
        ))}
      </group>
      <pointLight color="#21d9ff" intensity={2.2} distance={3} position={[0.45, 0.3, 0.8]} />
      <pointLight color="#875cff" intensity={1.6} distance={2.5} position={[-0.5, -0.35, 0.5]} />
    </group>
  );
}
