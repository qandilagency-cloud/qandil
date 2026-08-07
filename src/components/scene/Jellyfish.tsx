"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  buildBellGeometry,
  bellProfile,
  BELL_HEIGHT_SCALE,
  createTubeGeometry,
  updateTubeGeometry,
} from "./jellyfishGeometry";

// ── Public art-direction controls ──────────────────────────────────────────
export const JELLYFISH_SCALE = 1;
export const FLOAT_SPEED = 0.8;
export const FLOAT_DISTANCE = 0.12;
export const PULSE_SPEED = (Math.PI * 2) / 3.15;
export const MOUSE_INFLUENCE = 0.15;
export const FRESNEL_STRENGTH = 1.15;
export const CHROMATIC_STRENGTH = 0.32;
export const PRIMARY_COLOR = "#1268FF";
export const SECONDARY_COLOR = "#21D9FF";
export const ACCENT_COLOR = "#00E6C7";
const TENTACLE_SPEED = 0.35;
const TENTACLE_AMPLITUDE = 0.4;
const TENTACLE_SMOOTH_SPEED = 2.2;

const CHROME_BLACK = "#070A12";
const CHROME_MID = "#151C2B";
const CHROME_SILVER = "#AAB7CC";
const LIME = "#D5F74C";
const PURPLE = "#875CFF";
const CORAL = "#FF719D";
const WHITE = "#F4FAFF";
const MAX_ROTATION_Y = THREE.MathUtils.degToRad(12);
const MAX_ROTATION_X = THREE.MathUtils.degToRad(8);
const MAX_ROTATION_Z = THREE.MathUtils.degToRad(4);
const POINTER_SMOOTH_SPEED = 4.2;
const JELLY_LOCAL_TOP = 0.92;
const JELLY_LOCAL_BOTTOM = 2.5;
const JELLY_LOCAL_WIDTH = 2.36;

type CompiledTitleShader = {
  uniforms: Record<string, { value: unknown }>;
};

const edgeVertexShader = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const edgeFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uFresnel;
  uniform float uChromatic;
  uniform vec2 uPointer;
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uAccent;
  uniform vec3 uLime;
  uniform vec3 uPurple;
  uniform vec3 uCoral;
  uniform vec3 uWhite;

  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(vViewDirection);
    float facing = clamp(dot(normal, viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 2.7);
    float thinRim = smoothstep(0.56, 1.0, vUv.y);
    float angleShift = dot(normal.xy, normalize(vec2(0.72, 0.38) + uPointer * 0.45));
    float spectrum = 0.5 + 0.5 * sin(
      fresnel * 16.0 + angleShift * 5.0 + uTime * 0.46
    );
    vec3 coolBand = mix(uPrimary, uSecondary, smoothstep(0.12, 0.62, spectrum));
    coolBand = mix(coolBand, uAccent, smoothstep(0.55, 0.82, spectrum));
    vec3 warmBand = mix(uPurple, uCoral, smoothstep(0.28, 0.86, 1.0 - spectrum));
    vec3 color = mix(coolBand, warmBand, smoothstep(0.58, 0.96, fresnel + normal.x * 0.2));
    color = mix(color, uLime, thinRim * smoothstep(0.74, 0.98, spectrum) * 0.6);

    float redFringe = smoothstep(0.62, 1.0, fresnel + normal.x * uChromatic * 0.3);
    float blueFringe = smoothstep(0.62, 1.0, fresnel - normal.x * uChromatic * 0.3);
    color += vec3(redFringe * 0.12, 0.0, blueFringe * 0.17);
    color += uWhite * pow(fresnel, 4.5) * uFresnel * 0.58;

    float alpha = fresnel * (0.16 + thinRim * 0.2) * uFresnel;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.42));
  }
`;

interface ArmRig {
  geometry: THREE.BufferGeometry;
  points: THREE.Vector3[];
  targetPoints: THREE.Vector3[];
  tubularSegments: number;
  radialSegments: number;
  angle: number;
  radius: number;
  length: number;
  rootRadius: number;
  tipRadius: number;
  phase: number;
  speedA: number;
  speedB: number;
  amplitudeA: number;
  amplitudeB: number;
  tendril: boolean;
  initialized: boolean;
}

function random(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeArms(count: number, tendril: boolean): ArmRig[] {
  const rng = random(tendril ? 875 : 1268);
  const tubularSegments = tendril ? 18 : 15;
  const radialSegments = tendril ? 5 : 7;

  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + rng() * 0.45;
    const pointCount = 8;
    return {
      geometry: createTubeGeometry(tubularSegments, radialSegments),
      points: Array.from({ length: pointCount }, () => new THREE.Vector3()),
      targetPoints: Array.from({ length: pointCount }, () => new THREE.Vector3()),
      tubularSegments,
      radialSegments,
      angle,
      radius: (tendril ? 0.22 : 0.1) + rng() * (tendril ? 0.34 : 0.28),
      length: (tendril ? 1.65 : 0.95) + rng() * (tendril ? 0.62 : 0.55),
      rootRadius: tendril ? 0.024 : 0.115 + rng() * 0.075,
      tipRadius: tendril ? 0.004 : 0.025,
      phase: rng() * Math.PI * 2,
      speedA: 0.62 + rng() * 0.72,
      speedB: 0.34 + rng() * 0.55,
      amplitudeA: (tendril ? 0.15 : 0.09) + rng() * 0.1,
      amplitudeB: (tendril ? 0.1 : 0.06) + rng() * 0.08,
      tendril,
      initialized: false,
    };
  });
}

function updateArm(
  rig: ArmRig,
  time: number,
  anchorY: number,
  pulse: number,
  deltaTime: number
) {
  const slowTime = time * TENTACLE_SPEED;
  const tentacleSmooth = 1 - Math.exp(-TENTACLE_SMOOTH_SPEED * deltaTime);

  for (let i = 0; i < rig.points.length; i++) {
    const u = i / (rig.points.length - 1);
    const falloff = Math.pow(u, 1.2);
    const waveA = Math.sin(slowTime * rig.speedA + rig.phase + u * 5.4);
    const waveB = Math.sin(slowTime * rig.speedB + rig.phase * 1.7 + u * 8.1);
    const curl = Math.sin(slowTime * (rig.speedA * 0.55) - rig.phase + u * 3.2);

    rig.targetPoints[i].set(
      Math.cos(rig.angle) * rig.radius +
        waveA * rig.amplitudeA * TENTACLE_AMPLITUDE * falloff +
        Math.cos(rig.angle + Math.PI / 2) *
          curl *
          rig.amplitudeB *
          TENTACLE_AMPLITUDE *
          falloff,
      anchorY -
        u * rig.length * (1 - pulse * 0.07) +
        waveB * 0.025 * TENTACLE_AMPLITUDE * falloff,
      Math.sin(rig.angle) * rig.radius +
        waveB * rig.amplitudeB * TENTACLE_AMPLITUDE * falloff +
        Math.sin(rig.angle + Math.PI / 2) *
          curl *
          rig.amplitudeA *
          TENTACLE_AMPLITUDE *
          falloff
    );
    if (rig.initialized) {
      rig.points[i].lerp(rig.targetPoints[i], tentacleSmooth);
    } else {
      rig.points[i].copy(rig.targetPoints[i]);
    }
  }
  rig.initialized = true;

  updateTubeGeometry(
    rig.geometry,
    rig.points,
    rig.tubularSegments,
    rig.radialSegments,
    (u) => {
      const taper = THREE.MathUtils.lerp(rig.rootRadius, rig.tipRadius, Math.pow(u, 1.35));
      return rig.tendril ? taper : taper * (1 + Math.sin(u * Math.PI * 4 + rig.phase) * 0.17);
    }
  );
}

export default function Jellyfish() {
  const reducedMotion = usePrefersReducedMotion();
  const { size, camera, gl } = useThree();
  const drawingBufferSize = useMemo(() => new THREE.Vector2(), []);
  const titleShadersRef = useRef<CompiledTitleShader[]>([]);
  const titleCanvas = useMemo(
    () => (typeof document === "undefined" ? null : document.createElement("canvas")),
    []
  );
  const titleTexture = useMemo(() => {
    if (!titleCanvas) return null;
    const texture = new THREE.CanvasTexture(titleCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }, [titleCanvas]);
  const mouseFollowRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const bellRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const scrollRef = useRef(0);
  const interaction = useRef({
    enabled: false,
    inside: false,
    ndc: new THREE.Vector2(),
    offsetX: 0,
    offsetY: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    hover: 0,
    pointerSpeed: 0,
    autoYaw: 0,
    pointerX: 0,
    pointerY: 0,
    positioned: false,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
  });

  const bellData = useMemo(() => buildBellGeometry(30, 48, 12), []);
  const arms = useMemo(() => [...makeArms(10, false), ...makeArms(6, true)], []);
  const chromeSilver = useMemo(() => new THREE.Color(CHROME_SILVER), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const projectedPosition = useMemo(() => new THREE.Vector3(), []);
  const safeLayout = useRef({ headerBottom: 72, progressTop: size.height * 0.76 });

  const edgeUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFresnel: { value: FRESNEL_STRENGTH },
      uChromatic: { value: CHROMATIC_STRENGTH },
      uPointer: { value: new THREE.Vector2() },
      uPrimary: { value: new THREE.Color(PRIMARY_COLOR) },
      uSecondary: { value: new THREE.Color(SECONDARY_COLOR) },
      uAccent: { value: new THREE.Color(ACCENT_COLOR) },
      uLime: { value: new THREE.Color(LIME) },
      uPurple: { value: new THREE.Color(PURPLE) },
      uCoral: { value: new THREE.Color(CORAL) },
      uWhite: { value: new THREE.Color(WHITE) },
    }),
    []
  );

  const bellMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(CHROME_MID),
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
        thickness: 0,
        ior: 1.45,
        alphaTest: 0,
        side: THREE.DoubleSide,
        depthWrite: true,
        depthTest: true,
      }),
    []
  );

  const edgeMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: edgeUniforms,
        vertexShader: edgeVertexShader,
        fragmentShader: edgeFragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [edgeUniforms]
  );

  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(CHROME_BLACK),
        emissive: new THREE.Color(CHROME_BLACK),
        emissiveIntensity: 0.08,
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
        thickness: 0,
        ior: 1.45,
        alphaTest: 0,
        side: THREE.DoubleSide,
        depthWrite: true,
      }),
    []
  );

  const haloMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color(SECONDARY_COLOR) },
          uOpacity: { value: 0.74 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            float distanceToCenter = distance(vUv, vec2(0.5));
            float glow = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
            glow = pow(glow, 2.1);
            gl_FragColor = vec4(uColor, glow * uOpacity);
          }
        `,
      }),
    []
  );

  useEffect(() => {
    if (!titleCanvas || !titleTexture) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const textureWidth = Math.min(Math.round(size.width * dpr), 2048);
    const textureHeight = Math.min(Math.round(size.height * dpr), 1536);
    titleCanvas.width = Math.max(textureWidth, 2);
    titleCanvas.height = Math.max(textureHeight, 2);
    const context = titleCanvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, titleCanvas.width, titleCanvas.height);
    const titleElement = document.querySelector("section h1");
    if (!titleElement) return;
    const rect = titleElement.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(titleElement);
    const scale = titleCanvas.width / size.width;
    const fontSize = Number.parseFloat(computedStyle.fontSize) * scale;
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) * scale;
    const maxWidth = rect.width * scale;
    const words = (titleElement.textContent || "").trim().split(/\s+/);
    const lines: string[] = [];

    context.direction = "rtl";
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.font = `700 ${fontSize}px "Cairo", sans-serif`;
    context.fillStyle = "rgba(190, 220, 230, 0.28)";
    words.forEach((word) => {
      const candidate = lines.length ? `${lines[lines.length - 1]} ${word}` : word;
      if (lines.length && context.measureText(candidate).width > maxWidth) {
        lines.push(word);
      } else if (lines.length) {
        lines[lines.length - 1] = candidate;
      } else {
        lines.push(word);
      }
    });

    lines.forEach((line, index) => {
      context.fillText(
        line,
        rect.right * scale,
        rect.top * scale + lineHeight * (index + 0.5)
      );
    });
    titleTexture.needsUpdate = true;
  }, [size.width, size.height, titleCanvas, titleTexture]);

  useEffect(() => {
    if (!titleTexture) return;
    const materials = [bellMaterial];
    titleShadersRef.current = [];
    materials.forEach((material) => {
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uTitleTexture = { value: titleTexture };
        shader.uniforms.uTitleResolution = {
          value: gl.getDrawingBufferSize(new THREE.Vector2()),
        };
        shader.uniforms.uTitleRefraction = { value: 0.035 };
        shader.uniforms.uTitleChromatic = { value: 0.003 };
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
            uniform sampler2D uTitleTexture;
            uniform vec2 uTitleResolution;
            uniform float uTitleRefraction;
            uniform float uTitleChromatic;`
          )
          .replace(
            "#include <opaque_fragment>",
            `vec2 titleScreenUv = gl_FragCoord.xy / uTitleResolution;
            vec2 reflectionUv = titleScreenUv;
            vec2 titleDistortion = normal.xy * uTitleRefraction;
            vec2 reflectedUv = reflectionUv + titleDistortion;
            vec4 titleCenter = (
              texture2D(uTitleTexture, reflectedUv) * 0.34 +
              texture2D(uTitleTexture, reflectedUv + vec2(0.004, 0.0)) * 0.165 +
              texture2D(uTitleTexture, reflectedUv - vec2(0.004, 0.0)) * 0.165 +
              texture2D(uTitleTexture, reflectedUv + vec2(0.0, 0.004)) * 0.165 +
              texture2D(uTitleTexture, reflectedUv - vec2(0.0, 0.004)) * 0.165
            );
            float titleRed = texture2D(
              uTitleTexture,
              reflectionUv + titleDistortion * 1.12 + normal.xy * uTitleChromatic
            ).r;
            float titleGreen = titleCenter.g;
            float titleBlue = texture2D(
              uTitleTexture,
              reflectionUv + titleDistortion * 0.88 - normal.xy * uTitleChromatic
            ).b;
            float titleMask = smoothstep(0.015, 0.18, titleCenter.a);
            vec3 reflectedTitle = vec3(titleRed, titleGreen, titleBlue);
            vec3 reflectionTint = reflectedTitle * vec3(0.58, 0.82, 0.92);
            outgoingLight = mix(
              outgoingLight,
              reflectionTint,
              clamp(titleMask * 0.32, 0.0, 0.32)
            );
            #include <opaque_fragment>`
          );
        titleShadersRef.current.push(shader as CompiledTitleShader);
      };
      material.customProgramCacheKey = () => "qandil-title-refraction-v2";
      material.needsUpdate = true;
    });

    return () => {
      materials.forEach((material) => {
        material.onBeforeCompile = () => {};
        material.customProgramCacheKey = () => "";
        material.needsUpdate = true;
      });
      titleShadersRef.current = [];
    };
  }, [bellMaterial, gl, size.width, size.height, titleTexture]);

  const anchorY = useMemo(() => {
    const point = new THREE.Vector2();
    bellProfile(0.79, point);
    return point.y * BELL_HEIGHT_SCALE;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.querySelector("section");
      const height = hero?.getBoundingClientRect().height || window.innerHeight;
      scrollRef.current = THREE.MathUtils.clamp(window.scrollY / height, 0, 1);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const measureSafeLayout = () => {
      const hero = gl.domElement.closest("section");
      const heroRect = hero?.getBoundingClientRect();
      const headerRect = document.querySelector("header")?.getBoundingClientRect();
      const progressRect = hero
        ?.querySelector<HTMLElement>("[data-hero-progress]")
        ?.getBoundingClientRect();

      safeLayout.current.headerBottom = heroRect
        ? Math.max(0, (headerRect?.bottom ?? heroRect.top + 72) - heroRect.top)
        : 72;
      safeLayout.current.progressTop = heroRect && progressRect
        ? progressRect.top - heroRect.top
        : size.height * 0.76;
    };

    measureSafeLayout();
    window.addEventListener("resize", measureSafeLayout, { passive: true });
    return () => window.removeEventListener("resize", measureSafeLayout);
  }, [gl, size.height, size.width]);

  useEffect(() => {
    const state = interaction.current;
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    state.enabled = !coarsePointer.matches;
    if (!state.enabled) return;

    const onPointerMove = (event: PointerEvent) => {
      const now = performance.now();
      const elapsed = Math.max((now - state.lastTime) / 1000, 1 / 240);

      state.ndc.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1)
      );
      if (state.lastTime > 0) {
        const pixelsPerSecond =
          Math.hypot(event.clientX - state.lastX, event.clientY - state.lastY) / elapsed;
        state.pointerSpeed = Math.min(1, pixelsPerSecond / 1200);
      }
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.pointerX = event.clientX;
      state.pointerY = event.clientY;
      state.lastTime = now;
      state.inside = true;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  useEffect(
    () => () => {
      bellData.geometry.dispose();
      arms.forEach(({ geometry }) => geometry.dispose());
      bellMaterial.dispose();
      edgeMaterial.dispose();
      bodyMaterial.dispose();
      haloMaterial.dispose();
      titleTexture?.dispose();
    },
    [arms, bellData, bellMaterial, edgeMaterial, bodyMaterial, haloMaterial, titleTexture]
  );

  useFrame((state, rawDelta) => {
    const group = groupRef.current;
    const mouseFollowGroup = mouseFollowRef.current;
    const bell = bellRef.current;
    if (!mouseFollowGroup || !group || !bell) return;

    const deltaTime = Math.min(rawDelta, 1 / 30);
    const time = state.clock.elapsedTime;
    const motion = reducedMotion ? 0 : 1;
    const scroll = scrollRef.current;
    const pointerState = interaction.current;
    const pointerActive = pointerState.enabled && pointerState.inside && !reducedMotion;
    const smooth = 1 - Math.exp(-POINTER_SMOOTH_SPEED * deltaTime);
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const distanceFromCamera = Math.abs(
      perspectiveCamera.position.z - mouseFollowGroup.position.z
    );
    const visibleHeight =
      2 *
      Math.tan(THREE.MathUtils.degToRad(perspectiveCamera.fov / 2)) *
      distanceFromCamera;
    const visibleWidth = visibleHeight * perspectiveCamera.aspect;
    const worldPerPixel = visibleHeight / size.height;
    const isMobile = size.width < 768;
    const compactMotion = size.width < 520;
    const usePointerTracking = pointerActive && !compactMotion;
    const topMargin = isMobile ? 14 : THREE.MathUtils.clamp(size.height * 0.025, 16, 30);
    const bottomMargin = isMobile ? 12 : THREE.MathUtils.clamp(size.height * 0.02, 14, 26);
    const availableHeight = Math.max(
      180,
      safeLayout.current.progressTop -
        safeLayout.current.headerBottom -
        topMargin -
        bottomMargin
    );
    const desktopHeightScale = THREE.MathUtils.clamp(
      size.height / 900,
      0.95,
      1.28
    );
    const preferredHeight = isMobile
      ? THREE.MathUtils.clamp(size.height * 0.29, 170, 250)
      : THREE.MathUtils.clamp(440 * desktopHeightScale, 430, 560);
    const jellyHeightPixels = Math.min(
      preferredHeight,
      availableHeight * (isMobile ? 0.52 : 0.96)
    );
    const scale =
      (jellyHeightPixels / (JELLY_LOCAL_TOP + JELLY_LOCAL_BOTTOM)) *
      worldPerPixel *
      JELLYFISH_SCALE;
    const jellyHalfWidthPixels =
      (JELLY_LOCAL_WIDTH * 0.5 * scale) / worldPerPixel;

    const floatSafetyPixels = 8;
    const desktopLeft =
      size.width * 0.04 + jellyHalfWidthPixels + floatSafetyPixels;
    const desktopRight =
      size.width * 0.58 - jellyHalfWidthPixels - floatSafetyPixels;
    const mobileCenterX = size.width * 0.5;
    const mobileRangeX = Math.min(size.width * 0.08, 42);
    const minCenterX = isMobile ? mobileCenterX - mobileRangeX : desktopLeft;
    const maxCenterX = isMobile
      ? mobileCenterX + mobileRangeX
      : Math.max(desktopLeft, desktopRight);
    const movementMinY = compactMotion
      ? size.height * 0.24
      : Math.max(
          safeLayout.current.headerBottom + 20,
          size.height * 0.16
        );
    const movementMaxY = compactMotion
      ? size.height * 0.7
      : size.height * 0.94;

    // Observe the full viewport, but clamp the target to the jellyfish-only area.
    const targetPixelX = usePointerTracking
      ? THREE.MathUtils.clamp(pointerState.pointerX, minCenterX, maxCenterX)
      : (minCenterX + maxCenterX) * 0.5;
    const verticalCenter = (movementMinY + movementMaxY) * 0.5;
    const amplifiedPointerY =
      verticalCenter + (pointerState.pointerY - verticalCenter) * 1.15;
    const targetPixelY = usePointerTracking
      ? THREE.MathUtils.clamp(
          amplifiedPointerY,
          movementMinY,
          movementMaxY
        )
      : verticalCenter;
    const targetOffsetX = (targetPixelX / size.width - 0.5) * visibleWidth;
    const targetOffsetY = (0.5 - targetPixelY / size.height) * visibleHeight;

    if (!pointerState.positioned) {
      pointerState.offsetX = targetOffsetX;
      pointerState.offsetY = targetOffsetY;
      pointerState.positioned = true;
    }

    const directionX = THREE.MathUtils.clamp(
      (targetOffsetX - pointerState.offsetX) /
        Math.max(visibleWidth * 0.09, 0.01),
      -1,
      1
    );
    const directionY = THREE.MathUtils.clamp(
      (targetOffsetY - pointerState.offsetY) /
        Math.max(visibleHeight * 0.09, 0.01),
      -1,
      1
    );
    const targetRotationX = -directionY * MAX_ROTATION_X;
    const targetRotationY = directionX * MAX_ROTATION_Y;
    const targetRotationZ = -directionX * MAX_ROTATION_Z;

    pointerState.offsetX += (targetOffsetX - pointerState.offsetX) * smooth;
    pointerState.offsetY += (targetOffsetY - pointerState.offsetY) * smooth;
    pointerState.rotationX += (targetRotationX - pointerState.rotationX) * smooth;
    pointerState.rotationY += (targetRotationY - pointerState.rotationY) * smooth;
    pointerState.rotationZ += (targetRotationZ - pointerState.rotationZ) * smooth;
    pointerState.pointerSpeed +=
      (0 - pointerState.pointerSpeed) * (1 - Math.exp(-4.5 * deltaTime));

    const floatY =
      Math.sin(time * FLOAT_SPEED) * FLOAT_DISTANCE * 0.38 * motion;
    const floatX = Math.sin(time * 0.45) * 0.018 * motion;
    mouseFollowGroup.position.set(
      pointerState.offsetX,
      pointerState.offsetY,
      0
    );
    mouseFollowGroup.rotation.set(
      pointerState.rotationX,
      pointerState.rotationY,
      pointerState.rotationZ
    );
    group.position.set(
      floatX - scroll * 0.08,
      floatY + scroll * 0.12,
      0
    );
    group.rotation.x = -0.12;
    pointerState.autoYaw += 0.12 * deltaTime * motion;
    group.rotation.y = pointerState.autoYaw;
    group.rotation.z = 0;

    mouseFollowGroup.updateMatrixWorld(true);
    let isHovered = false;
    if (pointerActive) {
      raycaster.setFromCamera(pointerState.ndc, camera);
      isHovered = raycaster.intersectObject(bell, false).length > 0;
    }
    const hoverTarget = isHovered ? 1 : 0;
    pointerState.hover +=
      (hoverTarget - pointerState.hover) * (1 - Math.exp(-5.2 * deltaTime));
    group.scale.setScalar(scale * (1 + pointerState.hover * 0.03));

    const pulseWave = 0.5 - 0.5 * Math.cos(time * PULSE_SPEED);
    const organicPulse = THREE.MathUtils.smoothstep(pulseWave, 0.08, 0.92) * motion;
    const position = bell.geometry.getAttribute("position") as THREE.BufferAttribute;
    const { basePositions, vParams, angleParams } = bellData;

    for (let i = 0; i < vParams.length; i++) {
      const v = vParams[i];
      const rimWeight = THREE.MathUtils.smoothstep(v, 0.48, 1);
      const rimWave =
        Math.sin(time * 1.18 + angleParams[i] * 5) * 0.018 * rimWeight * motion;
      const radialPulse = 1 - organicPulse * 0.085 * rimWeight;
      position.setXYZ(
        i,
        basePositions[i * 3] * radialPulse,
        basePositions[i * 3 + 1] + organicPulse * 0.055 * (1 - v) + rimWave,
        basePositions[i * 3 + 2] * radialPulse
      );
    }
    position.needsUpdate = true;
    bell.geometry.computeVertexNormals();

    arms.forEach((arm) =>
      updateArm(
        arm,
        time * motion * (1 + pointerState.pointerSpeed * 0.1),
        anchorY - organicPulse * 0.0245,
        organicPulse,
        deltaTime
      )
    );

    const spectralShift = (0.5 + 0.5 * Math.sin(time * 0.34 + group.rotation.y)) * motion;
    projectedPosition.setFromMatrixPosition(group.matrixWorld).project(camera);
    const pointerDistance = pointerActive
      ? Math.hypot(
          pointerState.ndc.x - projectedPosition.x,
          pointerState.ndc.y - projectedPosition.y
        )
      : 1;
    const proximity = pointerActive ? 1 - THREE.MathUtils.clamp(pointerDistance / 0.5, 0, 1) : 0;
    const interactionEnergy = Math.max(proximity, pointerState.hover);
    edgeUniforms.uTime.value = time * motion;
    edgeUniforms.uPointer.value.set(
      pointerState.rotationY / MAX_ROTATION_Y,
      -pointerState.rotationX / MAX_ROTATION_X
    );
    edgeUniforms.uChromatic.value =
      CHROMATIC_STRENGTH * (1 + scroll * 1.1 + pointerState.pointerSpeed * 0.42);
    edgeUniforms.uFresnel.value =
      FRESNEL_STRENGTH * (1 + interactionEnergy * 0.18);
    titleShadersRef.current.forEach((shader) => {
      const resolution = shader.uniforms.uTitleResolution?.value as THREE.Vector2 | undefined;
      if (resolution) gl.getDrawingBufferSize(drawingBufferSize);
      if (resolution) resolution.copy(drawingBufferSize);
      if (shader.uniforms.uTitleRefraction) {
        shader.uniforms.uTitleRefraction.value =
          0.035 * (1 + pointerState.hover * 0.14 + pointerState.pointerSpeed * 0.06);
      }
    });
    bellMaterial.iridescenceThicknessRange = [
      180 + spectralShift * 130,
      850 - spectralShift * 110,
    ];
    bodyMaterial.iridescenceThicknessRange = [
      220 + spectralShift * 160,
      820 - spectralShift * 90,
    ];
    bellMaterial.envMapIntensity = 1.8 + interactionEnergy * 0.4;
    bodyMaterial.envMapIntensity = 1.8 + interactionEnergy * 0.4;
    bellMaterial.color
      .set(CHROME_MID)
      .lerp(chromeSilver, 0.08 + spectralShift * 0.05);
    if (haloRef.current) {
      haloRef.current.scale.set(3.25, 3.25, 1);
      haloMaterial.uniforms.uOpacity.value = 0.7 * (1 - scroll * 0.3);
    }
  });

  return (
    <group ref={mouseFollowRef}>
      <group ref={groupRef}>
        <mesh ref={haloRef} material={haloMaterial} position={[0, -0.2, -0.7]}>
          <planeGeometry args={[1, 1]} />
        </mesh>
        <mesh ref={bellRef} geometry={bellData.geometry} material={bellMaterial} renderOrder={2} />
        <mesh
          geometry={bellData.geometry}
          material={edgeMaterial}
          renderOrder={3}
          scale={1.012}
        />
        {arms.map((arm, index) => (
          <mesh
            key={`${arm.tendril ? "tendril" : "arm"}-${index}`}
            geometry={arm.geometry}
            material={bodyMaterial}
            renderOrder={1}
          />
        ))}
        <pointLight color={SECONDARY_COLOR} intensity={2.1} distance={3.6} decay={2} position={[0, 0.1, 0.4]} />
        <pointLight color={ACCENT_COLOR} intensity={1.15} distance={3} decay={2} position={[0.6, -0.7, 0.25]} />
      </group>
    </group>
  );
}
