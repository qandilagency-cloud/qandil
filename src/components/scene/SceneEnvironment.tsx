"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** Procedural studio environment: bright strips and dark panels for liquid-chrome reflections. */
export default function SceneEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const studio = new RoomEnvironment();
    studio.background = new THREE.Color(0x070a12);
    const envTexture = pmrem.fromScene(studio, 0.015).texture;
    scene.environment = envTexture;

    return () => {
      scene.environment = null;
      studio.dispose();
      envTexture.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return null;
}
