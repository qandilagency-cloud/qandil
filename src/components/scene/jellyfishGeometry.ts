import * as THREE from "three";

export interface BellGeometryData {
  geometry: THREE.BufferGeometry;
  basePositions: Float32Array;
  vParams: Float32Array;
  angleParams: Float32Array;
  radialSegments: number;
  ringCount: number;
  rimRing: number;
  oralRing: number;
}

/**
 * Builds a single continuous dome + skirt mesh (apex -> widest rim -> flared
 * lower membrane) from one Catmull-Rom profile revolved around Y, so there is
 * no seam between the "bell" and the "membrane" -- they are the same surface.
 */
const DOME_END = 0.68;
export const BELL_WIDTH_SCALE = 1;
export const BELL_HEIGHT_SCALE = 0.8;

/**
 * Profile of the bell in (radius, height) at parameter v in [0,1]: a broad,
 * gently flattened dome (not a full round hemisphere) down to the widest
 * point, continuing smoothly into a short, flared, tapering rim. Matched
 * first-derivatives at v = DOME_END keep the join seamless.
 */
export function bellProfile(v: number, out: THREE.Vector2): THREE.Vector2 {
  if (v <= DOME_END) {
    const u = v / DOME_END;
    const theta = u * (Math.PI / 2);
    out.set(Math.sin(theta), Math.cos(theta) * 0.82 + 0.18);
  } else {
    const u = (v - DOME_END) / (1 - DOME_END);
    const r = 1 + 0.05 * (1 - Math.cos(u * Math.PI)) - u * u * 0.3;
    const y = 0.18 - 0.95 * u + 0.32 * u * u;
    out.set(r, y);
  }
  return out;
}

export function buildBellGeometry(rings: number, radialSegments: number, seed = 1): BellGeometryData {
  const ringCount = rings + 1;
  const positions = new Float32Array(ringCount * radialSegments * 3);
  const vParams = new Float32Array(ringCount * radialSegments);
  const angleParams = new Float32Array(ringCount * radialSegments);
  const uvs = new Float32Array(ringCount * radialSegments * 2);

  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 233280 + 49297) % 233281;
    return s / 233281;
  };

  const p = new THREE.Vector2();

  let idx = 0;
  for (let ring = 0; ring < ringCount; ring++) {
    const v = ring / rings;
    bellProfile(v, p);
    const asymGrow = THREE.MathUtils.smoothstep(v, 0.12, 0.85);
    const rimGrow = THREE.MathUtils.smoothstep(v, 0.68, 0.92);

    for (let seg = 0; seg < radialSegments; seg++) {
      const angle = (seg / radialSegments) * Math.PI * 2;

      // gentle overall lean (large-scale asymmetry) + a soft, low-frequency
      // scalloped ripple concentrated at the rim, like a thin elastic edge.
      const asym =
        1 +
        asymGrow * (0.05 * Math.sin(angle * 3 + seed * 1.7) + 0.035 * Math.sin(angle * 5 - seed * 0.9));
      const scallop = 1 + rimGrow * 0.07 * Math.sin(angle * 11 + seed * 2.1) + rimGrow * 0.035 * Math.sin(angle * 17 - seed * 3.3);
      const jitter = 1 + (rand() - 0.5) * 0.016 * asymGrow;

      const r = p.x * asym * scallop * jitter;
      const x = Math.cos(angle) * r * BELL_WIDTH_SCALE;
      const z = Math.sin(angle) * r * BELL_WIDTH_SCALE;
      const y = p.y * BELL_HEIGHT_SCALE + rimGrow * 0.02 * Math.sin(angle * 11 + seed * 2.1);

      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      vParams[idx] = v;
      angleParams[idx] = angle;
      uvs[idx * 2] = seg / radialSegments;
      uvs[idx * 2 + 1] = v;

      idx++;
    }
  }

  const indices: number[] = [];
  for (let ring = 0; ring < ringCount - 1; ring++) {
    for (let seg = 0; seg < radialSegments; seg++) {
      const a = ring * radialSegments + seg;
      const b = ring * radialSegments + ((seg + 1) % radialSegments);
      const c = (ring + 1) * radialSegments + seg;
      const d = (ring + 1) * radialSegments + ((seg + 1) % radialSegments);
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return {
    geometry,
    basePositions: positions,
    vParams,
    angleParams,
    radialSegments,
    ringCount,
    rimRing: Math.round(rings * 0.8),
    oralRing: Math.round(rings * 0.46),
  };
}

/** Preallocated round-tube geometry, updated in place from a moving spline each frame. */
export function createTubeGeometry(tubularSegments: number, radialSegments: number): THREE.BufferGeometry {
  const ringCount = tubularSegments + 1;
  const vertCount = ringCount * radialSegments;
  const positions = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);

  for (let i = 0; i < ringCount; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const vi = i * radialSegments + j;
      uvs[vi * 2] = j / radialSegments;
      uvs[vi * 2 + 1] = i / tubularSegments;
    }
  }

  const indices: number[] = [];
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * radialSegments + j;
      const b = i * radialSegments + ((j + 1) % radialSegments);
      const c = (i + 1) * radialSegments + j;
      const d = (i + 1) * radialSegments + ((j + 1) % radialSegments);
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(vertCount * 3), 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

const _curve = new THREE.CatmullRomCurve3([], false, "catmullrom", 0.4);
_curve.arcLengthDivisions = 24;
const _normal = new THREE.Vector3();
const _binormal = new THREE.Vector3();
const _pt = new THREE.Vector3();

/**
 * Sweeps a round profile along `controlPoints` into an existing tube
 * geometry. `radiusAt(t)` gives the radius at each point along the length
 * (t in [0,1]) -- a plain taper for delicate tendrils, or a smooth bulging
 * profile for the dense oral-arm clumps. Because the cross-section is always
 * a full circle, the result has no flat faces and no sharp/triangular reading
 * at any viewing angle.
 */
export function updateTubeGeometry(
  geometry: THREE.BufferGeometry,
  controlPoints: THREE.Vector3[],
  tubularSegments: number,
  radialSegments: number,
  radiusAt: (t: number) => number
) {
  _curve.points = controlPoints;
  _curve.updateArcLengths();
  const frames = _curve.computeFrenetFrames(tubularSegments, false);
  const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    _curve.getPointAt(t, _pt);
    _normal.copy(frames.normals[i]);
    _binormal.copy(frames.binormals[i]);
    const radius = radiusAt(t);

    for (let j = 0; j < radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const cx = Math.cos(theta);
      const sx = Math.sin(theta);
      const nx = cx * _normal.x + sx * _binormal.x;
      const ny = cx * _normal.y + sx * _binormal.y;
      const nz = cx * _normal.z + sx * _binormal.z;

      const vi = i * radialSegments + j;
      posAttr.setXYZ(vi, _pt.x + nx * radius, _pt.y + ny * radius, _pt.z + nz * radius);
    }
  }

  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}

