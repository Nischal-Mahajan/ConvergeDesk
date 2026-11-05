import { forwardRef, useImperativeHandle, useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PANELS, CONNECTION_LINES } from "./heroConstants";

/**
 * Animated 3D Catmull-Rom glowing tubes connecting assembled panels in the workspace
 */
export const ConnectionLines = forwardRef(function ConnectionLines(
  { animState },
  ref
) {
  const lineMeshRefs = useRef([]);
  const groupRef = useRef();

  useImperativeHandle(ref, () => ({
    get lines() {
      return lineMeshRefs.current;
    },
  }));

  // Build curved tube geometries based on assembled panel destinations
  const linesData = useMemo(() => {
    return CONNECTION_LINES.map((c, i) => {
      const fromPanel = PANELS.find((p) => p.id === c.fromId) || PANELS[0];
      const toPanel = PANELS.find((p) => p.id === c.toId) || PANELS[1];

      const p1 = new THREE.Vector3(...fromPanel.destPos);
      const p2 = new THREE.Vector3(...toPanel.destPos);
      const mid = new THREE.Vector3(
        (p1.x + p2.x) / 2,
        (p1.y + p2.y) / 2,
        (p1.z + p2.z) / 2 + 0.35
      );

      const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
      const geometry = new THREE.TubeGeometry(curve, 32, 0.016, 8, false);

      const material = new THREE.MeshBasicMaterial({
        color: c.color,
        transparent: true,
        opacity: 0.85,
        toneMapped: false,
      });

      return {
        id: `conn-${i}`,
        ...c,
        geometry,
        material,
        p1,
        p2,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const linesState = animState?.current?.lines;

    linesData.forEach((line, i) => {
      const mesh = lineMeshRefs.current[i];
      if (!mesh) return;

      const progress = linesState?.[i]?.opacity ?? 0;

      if (progress <= 0.02) {
        mesh.visible = false;
      } else {
        mesh.visible = true;
        const pulse = Math.sin(t * 3.2 + i * 1.3) * 0.15 + 0.85;
        line.material.opacity = pulse * THREE.MathUtils.clamp(progress, 0, 1);
      }
    });
  });

  return (
    <group ref={groupRef} name="connectionLines">
      {linesData.map((line, i) => (
        <group
          key={line.id}
          ref={(el) => {
            lineMeshRefs.current[i] = el;
          }}
          visible={false}
        >
          {/* Main glowing connection circuit */}
          <mesh geometry={line.geometry} material={line.material} />

          {/* Node termination spheres */}
          <mesh position={line.p1}>
            <sphereGeometry args={[0.038, 16, 16]} />
            <meshBasicMaterial
              color={line.color}
              transparent
              opacity={0.9}
              toneMapped={false}
            />
          </mesh>

          <mesh position={line.p2}>
            <sphereGeometry args={[0.038, 16, 16]} />
            <meshBasicMaterial
              color={line.color}
              transparent
              opacity={0.9}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
});

export default ConnectionLines;
