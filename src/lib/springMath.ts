/** One semi-implicit-Euler step of a damped mass-spring. Returns [newPos, newVel]. */
export function springStep(
  pos: number,
  vel: number,
  target: number,
  stiffness: number,
  damping: number,
  dt: number
): [number, number] {
  const accel = (target - pos) * stiffness - vel * damping;
  const newVel = vel + accel * dt;
  const newPos = pos + newVel * dt;
  return [newPos, newVel];
}

/** Damping coefficient that gives a gentle, slightly-underdamped settle (a small, natural overshoot). */
export function softDamping(stiffness: number, ratio = 0.8): number {
  return 2 * Math.sqrt(stiffness) * ratio;
}
