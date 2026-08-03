import * as THREE from "three";
import { BRAND } from "@/lib/theme";

const pearl = new THREE.Color(BRAND.pearl);
const navy = new THREE.Color(BRAND.navy);
const deepTeal = new THREE.Color(BRAND.deepTeal);
// Tonal variations derived from the brand blue/navy for realistic shading --
// not new brand hues, just how the same family of blues reads at different
// thickness, depth and lighting.
const royalBlue = new THREE.Color(0x3f6fd6);
const brightCyan = new THREE.Color(0x3fd3ec);
const turquoise = new THREE.Color(0x22c9b0);

const _c = new THREE.Color();

/**
 * Translucent royal blue across most of the bell (the dominant read), with
 * deep navy reserved for thicker/shadowed pockets, a small pearl cap at the
 * apex, cyan brightening only at the rippled rim, and barely-there radial
 * structure -- a hint of internal anatomy, not a bold decorative stripe.
 */
export function bellVertexColors(vParams: Float32Array, angleParams: Float32Array): Float32Array {
  const count = vParams.length;
  const colors = new Float32Array(count * 3);
  const ribCount = 26;

  for (let i = 0; i < count; i++) {
    const v = vParams[i];
    const angle = angleParams[i];

    _c.copy(royalBlue);
    _c.lerp(pearl, 0.4 * (1 - THREE.MathUtils.smoothstep(v, 0, 0.12)));

    const shadowSide = 0.5 + 0.5 * Math.cos(angle - 2.3);
    _c.lerp(navy, THREE.MathUtils.smoothstep(v, 0.3, 0.62) * (0.35 + shadowSide * 0.35));
    _c.lerp(brightCyan, THREE.MathUtils.smoothstep(v, 0.8, 1) * 0.4);

    const ribPattern = Math.pow(Math.abs(Math.sin(angle * ribCount * 0.5)), 3);
    const ribMask = THREE.MathUtils.smoothstep(v, 0.1, 0.3) * (1 - THREE.MathUtils.smoothstep(v, 0.5, 0.68));
    _c.lerp(brightCyan, ribPattern * ribMask * 0.12);

    _c.lerp(deepTeal, THREE.MathUtils.smoothstep(v, 0.86, 1) * shadowSide * 0.3);

    colors[i * 3] = _c.r;
    colors[i * 3 + 1] = _c.g;
    colors[i * 3 + 2] = _c.b;
  }

  return colors;
}

/**
 * For the dense, rounded oral-arm clumps: deep navy near the root (thick,
 * shadowed, close against the bell), opening into royal blue and a diffused
 * turquoise glow through the body, then fading toward a delicate pale-cyan
 * tip. `angleParams` (the tube's own radial angle) adds a soft rotational
 * variation so the color breathes around the form rather than banding.
 */
export function massTubeVertexColors(tubularSegments: number, radialSegments: number, warmth = 0): Float32Array {
  const ringCount = tubularSegments + 1;
  const colors = new Float32Array(ringCount * radialSegments * 3);

  for (let i = 0; i < ringCount; i++) {
    const t = i / tubularSegments;

    for (let j = 0; j < radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const wrap = 0.5 + 0.5 * Math.sin(theta * 2 + t * 5);

      _c.copy(navy);
      _c.lerp(royalBlue, THREE.MathUtils.smoothstep(t, 0.08, 0.45) * 0.85);
      _c.lerp(turquoise, THREE.MathUtils.smoothstep(t, 0.22, 0.55) * (1 - THREE.MathUtils.smoothstep(t, 0.7, 0.95)) * (0.35 + wrap * 0.35));
      _c.lerp(brightCyan, THREE.MathUtils.smoothstep(t, 0.6, 1) * 0.45);
      _c.lerp(deepTeal, warmth * (1 - t) * 0.3);

      const vi = i * radialSegments + j;
      colors[vi * 3] = _c.r;
      colors[vi * 3 + 1] = _c.g;
      colors[vi * 3 + 2] = _c.b;
    }
  }

  return colors;
}

/** Deep navy root fading toward a delicate, pale-cyan trailing tip. */
export function tendrilVertexColors(tubularSegments: number, radialSegments: number): Float32Array {
  const ringCount = tubularSegments + 1;
  const colors = new Float32Array(ringCount * radialSegments * 3);

  for (let i = 0; i < ringCount; i++) {
    const t = i / tubularSegments;
    _c.copy(navy);
    _c.lerp(royalBlue, THREE.MathUtils.smoothstep(t, 0.1, 0.5));
    _c.lerp(brightCyan, THREE.MathUtils.smoothstep(t, 0.55, 1) * 0.7);

    for (let j = 0; j < radialSegments; j++) {
      const vi = i * radialSegments + j;
      colors[vi * 3] = _c.r;
      colors[vi * 3 + 1] = _c.g;
      colors[vi * 3 + 2] = _c.b;
    }
  }

  return colors;
}
