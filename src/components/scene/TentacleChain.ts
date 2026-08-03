import * as THREE from "three";
import { springStep } from "@/lib/springMath";

export interface TentacleChainOptions {
  segments: number;
  segmentLength: number;
  lengthJitter?: number;
  stiffnessRange: [number, number];
  dampingRange: [number, number];
  seed?: number;
  /**
   * Radians of progressive rotation applied to the rest direction per
   * segment index, around a fixed per-chain axis. Without this the chain's
   * rest pose is a dead-straight line -- a wide ribbon built from a straight
   * spine reads as a flat triangular blade, not flowing tissue. A small
   * nonzero curl gives every chain a natural, individual bend/twist.
   */
  curlPerSegment?: number;
}

const _target = new THREE.Vector3();
const _rotatedDir = new THREE.Vector3();

/**
 * A chain of spring-connected points trailing a moving root. Rendered later as
 * one continuous spline (see jellyfishGeometry), so although the simulation is
 * segment-based internally, nothing about it reads as jointed on screen.
 *
 * Stiffness/damping soften from root to tip, which alone produces the cascade
 * of "body first, tip last" -- no explicit delay timers are needed.
 */
export class TentacleChain {
  readonly points: THREE.Vector3[];
  private velocities: THREE.Vector3[];
  private restLengths: number[];
  private stiffness: number[];
  private damping: number[];
  private curlPerSegment: number;
  private bendAxis: THREE.Vector3;

  constructor(opts: TentacleChainOptions) {
    const { segments, segmentLength, lengthJitter = 0.15, stiffnessRange, dampingRange, seed = 1, curlPerSegment = 0 } = opts;
    this.points = [];
    this.velocities = [];
    this.restLengths = [];
    this.stiffness = [];
    this.damping = [];
    this.curlPerSegment = curlPerSegment;

    let s = (seed * 7919 + 1) % 2147483647;
    const rand = () => {
      s = (s * 48271) % 2147483647;
      return s / 2147483647;
    };

    const axisAngle = rand() * Math.PI * 2;
    this.bendAxis = new THREE.Vector3(Math.cos(axisAngle), (rand() - 0.5) * 0.7, Math.sin(axisAngle)).normalize();

    for (let i = 0; i <= segments; i++) {
      this.points.push(new THREE.Vector3());
      this.velocities.push(new THREE.Vector3());
      const t = segments === 0 ? 0 : i / segments;
      this.restLengths.push(segmentLength * (1 + (rand() - 0.5) * lengthJitter));
      this.stiffness.push(THREE.MathUtils.lerp(stiffnessRange[0], stiffnessRange[1], t));
      this.damping.push(THREE.MathUtils.lerp(dampingRange[0], dampingRange[1], t));
    }
  }

  private curledDirection(i: number, restDirection: THREE.Vector3, out: THREE.Vector3): THREE.Vector3 {
    out.copy(restDirection);
    if (this.curlPerSegment !== 0) {
      out.applyAxisAngle(this.bendAxis, this.curlPerSegment * i);
    }
    return out;
  }

  /** Lay every point out along the (curled) rest pose from `rootPos` with zero velocity (mount / entrance). */
  reset(rootPos: THREE.Vector3, direction: THREE.Vector3) {
    this.points[0].copy(rootPos);
    let prev = rootPos;
    for (let i = 1; i < this.points.length; i++) {
      const p = this.points[i];
      this.curledDirection(i, direction, _rotatedDir);
      p.copy(prev).addScaledVector(_rotatedDir, this.restLengths[i]);
      this.velocities[i].set(0, 0, 0);
      prev = p;
    }
  }

  update(dt: number, rootPos: THREE.Vector3, restDirection: THREE.Vector3) {
    this.points[0].copy(rootPos);
    let prev = this.points[0];

    for (let i = 1; i < this.points.length; i++) {
      const p = this.points[i];
      const v = this.velocities[i];
      this.curledDirection(i, restDirection, _rotatedDir);
      _target.copy(prev).addScaledVector(_rotatedDir, this.restLengths[i]);

      const [nx, vx] = springStep(p.x, v.x, _target.x, this.stiffness[i], this.damping[i], dt);
      const [ny, vy] = springStep(p.y, v.y, _target.y, this.stiffness[i], this.damping[i], dt);
      const [nz, vz] = springStep(p.z, v.z, _target.z, this.stiffness[i], this.damping[i], dt);

      p.set(nx, ny, nz);
      v.set(vx, vy, vz);
      prev = p;
    }
  }
}
