// Minimal damped mass-spring integrator (semi-implicit Euler).
// Used instead of plain lerp so cursor-driven motion carries real
// momentum: it can slightly overshoot and settle, rather than only
// ever monotonically approaching its target.

export function createSpring(initialValue = 0) {
  return { value: initialValue, velocity: 0, target: initialValue };
}

// dt in seconds. Clamp dt so a backgrounded/throttled tab resuming
// with a huge elapsed time doesn't fling the spring into orbit.
const MAX_DT = 1 / 30;

export function stepSpring(spring, dt, stiffness = 170, damping = 20) {
  const clampedDt = Math.min(dt, MAX_DT);
  const force = (spring.target - spring.value) * stiffness;
  const dampingForce = spring.velocity * damping;
  const acceleration = force - dampingForce;
  spring.velocity += acceleration * clampedDt;
  spring.value += spring.velocity * clampedDt;
  return spring.value;
}
