import * as THREE from "three";

/**
 * Analytical Two-Bone Inverse Kinematics Solver
 * Solves shoulder and elbow rotations so the wrist precisely reaches targetPosition.
 *
 * @param {THREE.Vector3} shoulderPos - World position of the shoulder joint
 * @param {THREE.Vector3} targetPos   - Desired world position for the wrist
 * @param {number} l1                 - Upper arm length
 * @param {number} l2                 - Forearm length
 * @param {THREE.Vector3} poleVector  - Hint direction for elbow bend (usually back/down)
 * @param {boolean} isLeft            - True for left arm, false for right
 * @returns {{ upperArmQuat: THREE.Quaternion, forearmQuat: THREE.Quaternion, reachedPos: THREE.Vector3 }}
 */
export function solveTwoBoneIK(
  shoulderPos,
  targetPos,
  l1,
  l2,
  poleVector,
  isLeft = false
) {
  const dir = new THREE.Vector3().subVectors(targetPos, shoulderPos);
  const maxReach = l1 + l2 - 0.001;
  const minReach = Math.abs(l1 - l2) + 0.001;
  const dist = THREE.MathUtils.clamp(dir.length(), minReach, maxReach);

  if (dist < 0.0001) {
    return {
      upperArmQuat: new THREE.Quaternion(),
      forearmQuat: new THREE.Quaternion(),
      reachedPos: shoulderPos.clone(),
    };
  }

  dir.normalize();

  // Angle between upper arm and shoulder-target line
  const cosShoulder = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
  const shoulderAngle = Math.acos(THREE.MathUtils.clamp(cosShoulder, -1, 1));

  // Determine bend plane using pole vector
  const pole = poleVector.clone().normalize();
  let bendNormal = new THREE.Vector3().crossVectors(dir, pole);
  if (bendNormal.lengthSq() < 0.0001) {
    bendNormal = new THREE.Vector3(0, 0, isLeft ? -1 : 1);
  } else {
    bendNormal.normalize();
  }

  // Upper arm direction
  const upperArmDir = dir
    .clone()
    .applyAxisAngle(bendNormal, isLeft ? shoulderAngle : -shoulderAngle);

  // Forearm direction
  const elbowPos = shoulderPos.clone().addScaledVector(upperArmDir, l1);
  const forearmDir = targetPos.clone().sub(elbowPos).normalize();

  // Compute quaternions relative to default downward arm (-Y)
  const defaultDir = new THREE.Vector3(0, -1, 0);

  const upperArmQuat = new THREE.Quaternion().setFromUnitVectors(
    defaultDir,
    upperArmDir
  );

  // Forearm relative to upper arm
  const forearmQuatWorld = new THREE.Quaternion().setFromUnitVectors(
    defaultDir,
    forearmDir
  );
  const upperArmInv = upperArmQuat.clone().invert();
  const forearmQuat = upperArmInv.multiply(forearmQuatWorld);

  const reachedPos = elbowPos.clone().addScaledVector(forearmDir, l2);

  return { upperArmQuat, forearmQuat, reachedPos };
}
