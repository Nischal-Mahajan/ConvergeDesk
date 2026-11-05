import { forwardRef, useImperativeHandle, useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { solveTwoBoneIK } from "./ikSolver";

/**
 * Anatomical, stylized luxury humanoid character.
 * Renders with refined materials, natural body proportions, and true 2-Bone IK arms.
 */
export const HumanCharacter = forwardRef(function HumanCharacter(
  { animState },
  ref
) {
  const rootRef = useRef();
  const spineGroupRef = useRef();
  const leftShoulderRef = useRef();
  const rightShoulderRef = useRef();
  const leftUpperArmRef = useRef();
  const leftForearmRef = useRef();
  const leftHandRef = useRef();
  const rightUpperArmRef = useRef();
  const rightForearmRef = useRef();
  const rightHandRef = useRef();

  // Arm segment lengths
  const L1 = 0.52; // Upper arm length
  const L2 = 0.48; // Forearm length

  useImperativeHandle(ref, () => ({
    root: rootRef.current,
    spine: spineGroupRef.current,
    leftHand: leftHandRef.current,
    rightHand: rightHandRef.current,
  }));

  // Luxury matte porcelain and dark titanium materials
  const skinMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f5f4fa",
        roughness: 0.22,
        metalness: 0.1,
      }),
    []
  );

  const suitMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#181922",
        roughness: 0.45,
        metalness: 0.25,
      }),
    []
  );

  const jointMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#282a38",
        roughness: 0.3,
        metalness: 0.7,
      }),
    []
  );

  const accentMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#7c5cfc",
        emissive: "#7c5cfc",
        emissiveIntensity: 0.55,
        roughness: 0.2,
      }),
    []
  );

  // Anatomical Geometries
  const headGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.24, 32, 24);
    geo.scale(0.85, 1.15, 0.95);
    return geo;
  }, []);

  const neckGeo = useMemo(() => {
    return new THREE.CylinderGeometry(0.085, 0.11, 0.22, 20);
  }, []);

  const chestGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.38, 0.32, 0.55, 24);
    geo.scale(1.2, 1.0, 0.75);
    return geo;
  }, []);

  const waistGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.32, 0.34, 0.38, 24);
    geo.scale(1.05, 1.0, 0.72);
    return geo;
  }, []);

  const hipsGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.34, 0.36, 0.28, 24);
    geo.scale(1.15, 1.0, 0.78);
    return geo;
  }, []);

  const deltoidGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.12, 20, 16);
    geo.scale(0.9, 1.2, 0.9);
    return geo;
  }, []);

  const upperArmGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.08, 0.065, L1, 20);
    // Pivot at top of cylinder
    geo.translate(0, -L1 / 2, 0);
    return geo;
  }, [L1]);

  const forearmGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.065, 0.05, L2, 20);
    // Pivot at top of cylinder
    geo.translate(0, -L2 / 2, 0);
    return geo;
  }, [L2]);

  const handGeo = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.09, 0.14, 0.05);
    geo.translate(0, -0.07, 0);
    return geo;
  }, []);

  const fingerGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.012, 0.01, 0.08, 10);
    geo.translate(0, -0.04, 0);
    return geo;
  }, []);

  const thighGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.13, 0.095, 0.75, 20);
    geo.translate(0, -0.375, 0);
    return geo;
  }, []);

  const calfGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.095, 0.07, 0.72, 20);
    geo.translate(0, -0.36, 0);
    return geo;
  }, []);

  const footGeo = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.12, 0.1, 0.28);
    geo.translate(0, -0.05, 0.05);
    return geo;
  }, []);

  // Frame loop: updates IK solver & natural idle breathing
  useFrame(({ clock }) => {
    if (!rootRef.current) return;
    const t = clock.elapsedTime;
    const s = animState?.current;
    if (!s) return;

    // 1. Spine rotation & subtle weight shift
    const bodyRotY = s.char?.bodyRotY || 0;
    const idleWeight = s.char?.idleWeight ?? 1;

    // Organic breathing & gentle torso sway
    const breathY = Math.sin(t * 1.6) * 0.008 * idleWeight;
    const swayX = Math.sin(t * 0.8) * 0.012 * idleWeight;

    rootRef.current.rotation.y = bodyRotY + swayX;
    if (spineGroupRef.current) {
      spineGroupRef.current.position.y = breathY;
    }

    // 2. Solve Left Arm IK
    if (
      leftUpperArmRef.current &&
      leftForearmRef.current &&
      leftShoulderRef.current
    ) {
      const leftTarget = s.char?.leftHandTarget;
      if (leftTarget) {
        // Shoulder world position
        const shoulderWorld = new THREE.Vector3();
        leftShoulderRef.current.getWorldPosition(shoulderWorld);

        const targetVec = new THREE.Vector3(
          leftTarget.x,
          leftTarget.y,
          leftTarget.z
        );
        const pole = new THREE.Vector3(-0.3, -0.6, -0.8);

        const { upperArmQuat, forearmQuat } = solveTwoBoneIK(
          shoulderWorld,
          targetVec,
          L1,
          L2,
          pole,
          true
        );

        // Convert world quaternion to shoulder-local space
        const parentWorldQuat = new THREE.Quaternion();
        leftShoulderRef.current.getWorldQuaternion(parentWorldQuat);
        const parentInv = parentWorldQuat.clone().invert();

        leftUpperArmRef.current.quaternion.copy(
          parentInv.multiply(upperArmQuat)
        );
        leftForearmRef.current.quaternion.copy(forearmQuat);

        // Hand curl/grasp when holding panel
        if (leftHandRef.current) {
          const grasp = s.char?.leftGrasp || 0;
          leftHandRef.current.rotation.x = -grasp * 0.7;
          leftHandRef.current.rotation.z = -grasp * 0.4;
        }
      } else {
        // Rest position with subtle idle arm sway
        const armSway = Math.sin(t * 1.2) * 0.04 * idleWeight;
        leftUpperArmRef.current.rotation.set(0.05 + armSway, 0, 0.08);
        leftForearmRef.current.rotation.set(-0.1, 0, 0);
      }
    }

    // 3. Solve Right Arm IK
    if (
      rightUpperArmRef.current &&
      rightForearmRef.current &&
      rightShoulderRef.current
    ) {
      const rightTarget = s.char?.rightHandTarget;
      if (rightTarget) {
        const shoulderWorld = new THREE.Vector3();
        rightShoulderRef.current.getWorldPosition(shoulderWorld);

        const targetVec = new THREE.Vector3(
          rightTarget.x,
          rightTarget.y,
          rightTarget.z
        );
        const pole = new THREE.Vector3(0.3, -0.6, -0.8);

        const { upperArmQuat, forearmQuat } = solveTwoBoneIK(
          shoulderWorld,
          targetVec,
          L1,
          L2,
          pole,
          false
        );

        const parentWorldQuat = new THREE.Quaternion();
        rightShoulderRef.current.getWorldQuaternion(parentWorldQuat);
        const parentInv = parentWorldQuat.clone().invert();

        rightUpperArmRef.current.quaternion.copy(
          parentInv.multiply(upperArmQuat)
        );
        rightForearmRef.current.quaternion.copy(forearmQuat);

        if (rightHandRef.current) {
          const grasp = s.char?.rightGrasp || 0;
          rightHandRef.current.rotation.x = -grasp * 0.7;
          rightHandRef.current.rotation.z = grasp * 0.4;
        }
      } else {
        const armSway = Math.sin(t * 1.2 + 0.5) * 0.04 * idleWeight;
        rightUpperArmRef.current.rotation.set(0.05 - armSway, 0, -0.08);
        rightForearmRef.current.rotation.set(-0.1, 0, 0);
      }
    }
  });

  return (
    <group ref={rootRef} position={[0, -1.5, 0]}>
      {/* ── SPINE & UPPER BODY ── */}
      <group ref={spineGroupRef}>
        {/* Hips & Pelvis */}
        <mesh
          geometry={hipsGeo}
          material={suitMat}
          position={[0, 1.48, 0]}
          castShadow
        />

        {/* Waist & Abdomen */}
        <mesh
          geometry={waistGeo}
          material={suitMat}
          position={[0, 1.76, 0]}
          castShadow
        />

        {/* Athletic Chest & Ribcage */}
        <mesh
          geometry={chestGeo}
          material={suitMat}
          position={[0, 2.18, 0]}
          castShadow
        />

        {/* Core Accent Ring */}
        <mesh
          geometry={new THREE.TorusGeometry(0.33, 0.012, 16, 32)}
          material={accentMat}
          position={[0, 1.95, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />

        {/* Sculpted Neck */}
        <mesh
          geometry={neckGeo}
          material={skinMat}
          position={[0, 2.52, 0]}
          castShadow
        />

        {/* Refined Minimalist Head */}
        <group position={[0, 2.78, 0]}>
          <mesh geometry={headGeo} material={skinMat} castShadow />
          {/* Subtle Cybernetic Visor / Focus Beam */}
          <mesh
            position={[0, 0.04, 0.22]}
            material={accentMat}
            geometry={new THREE.BoxGeometry(0.24, 0.035, 0.05)}
          />
        </group>

        {/* ── LEFT ARM (with Deltoid Shoulder Pivot) ── */}
        <group ref={leftShoulderRef} position={[-0.46, 2.38, 0]}>
          <mesh geometry={deltoidGeo} material={suitMat} />
          <group ref={leftUpperArmRef}>
            <mesh geometry={upperArmGeo} material={suitMat} castShadow />
            {/* Left Elbow Joint */}
            <mesh
              position={[0, -L1, 0]}
              geometry={new THREE.SphereGeometry(0.062, 16, 16)}
              material={jointMat}
            />
            <group ref={leftForearmRef} position={[0, -L1, 0]}>
              <mesh geometry={forearmGeo} material={skinMat} castShadow />
              {/* Left Wrist & Hand */}
              <group ref={leftHandRef} position={[0, -L2, 0]}>
                <mesh geometry={handGeo} material={skinMat} castShadow />
                {/* 4 Fingers & Thumb */}
                {[-0.03, -0.01, 0.01, 0.03].map((fx, fi) => (
                  <mesh
                    key={fi}
                    position={[fx, -0.14, 0]}
                    geometry={fingerGeo}
                    material={skinMat}
                  />
                ))}
                {/* Thumb */}
                <mesh
                  position={[0.045, -0.07, 0.02]}
                  rotation={[0, 0, -0.45]}
                  geometry={fingerGeo}
                  material={skinMat}
                />
              </group>
            </group>
          </group>
        </group>

        {/* ── RIGHT ARM (with Deltoid Shoulder Pivot) ── */}
        <group ref={rightShoulderRef} position={[0.46, 2.38, 0]}>
          <mesh geometry={deltoidGeo} material={suitMat} />
          <group ref={rightUpperArmRef}>
            <mesh geometry={upperArmGeo} material={suitMat} castShadow />
            {/* Right Elbow Joint */}
            <mesh
              position={[0, -L1, 0]}
              geometry={new THREE.SphereGeometry(0.062, 16, 16)}
              material={jointMat}
            />
            <group ref={rightForearmRef} position={[0, -L1, 0]}>
              <mesh geometry={forearmGeo} material={skinMat} castShadow />
              {/* Right Wrist & Hand */}
              <group ref={rightHandRef} position={[0, -L2, 0]}>
                <mesh geometry={handGeo} material={skinMat} castShadow />
                {[-0.03, -0.01, 0.01, 0.03].map((fx, fi) => (
                  <mesh
                    key={fi}
                    position={[fx, -0.14, 0]}
                    geometry={fingerGeo}
                    material={skinMat}
                  />
                ))}
                <mesh
                  position={[-0.045, -0.07, 0.02]}
                  rotation={[0, 0, 0.45]}
                  geometry={fingerGeo}
                  material={skinMat}
                />
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* ── LOWER BODY / LEGS ── */}
      <group position={[0, 0, 0]}>
        {/* Left Leg */}
        <group position={[-0.2, 1.4, 0]}>
          <mesh geometry={thighGeo} material={suitMat} castShadow />
          <mesh
            position={[0, -0.75, 0]}
            geometry={new THREE.SphereGeometry(0.08, 16, 16)}
            material={jointMat}
          />
          <group position={[0, -0.75, 0]}>
            <mesh geometry={calfGeo} material={suitMat} castShadow />
            <mesh
              position={[0, -0.72, 0]}
              geometry={footGeo}
              material={suitMat}
              castShadow
            />
          </group>
        </group>

        {/* Right Leg */}
        <group position={[0.2, 1.4, 0]}>
          <mesh geometry={thighGeo} material={suitMat} castShadow />
          <mesh
            position={[0, -0.75, 0]}
            geometry={new THREE.SphereGeometry(0.08, 16, 16)}
            material={jointMat}
          />
          <group position={[0, -0.75, 0]}>
            <mesh geometry={calfGeo} material={suitMat} castShadow />
            <mesh
              position={[0, -0.72, 0]}
              geometry={footGeo}
              material={suitMat}
              castShadow
            />
          </group>
        </group>
      </group>
    </group>
  );
});
