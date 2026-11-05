import { useRef, useMemo, Suspense, Component } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { HumanCharacter } from "./HumanCharacter";
import { FeaturePanel } from "./FeaturePanel";
import { PANELS, CONNECTION_LINES } from "./heroConstants";
import { ConnectionLines } from "./ConnectionLines";
import { useHeroAnimation } from "./useHeroAnimation";

/**
 * WebGL Error Boundary to gracefully handle environments without WebGL
 */
class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("HeroScene WebGL Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="hero-webgl-fallback">
          <div style={{ textAlign: "center", color: "#6b6c71", padding: 40 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#7c5cfc",
                margin: "0 auto 16px",
                boxShadow: "0 0 24px #7c5cfc",
              }}
            />
            <p style={{ fontSize: 13, letterSpacing: 2, color: "#f0efe9" }}>
              CONVERGEDESK SPATIAL WORKSPACE
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Dark architectural perspective floor with subtle glowing distance fade
 */
function ArchitecturalFloor() {
  const gridHelper = useMemo(() => {
    const grid = new THREE.GridHelper(36, 36, 0x7c5cfc, 0x161720);
    grid.position.y = -1.52;
    return grid;
  }, []);

  return (
    <group>
      <primitive object={gridHelper} />
      {/* Contact shadow / dark reflective ground plane */}
      <mesh position={[0, -1.53, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#060708"
          roughness={0.65}
          metalness={0.4}
        />
      </mesh>
    </group>
  );
}

/**
 * SceneContent runs inside the R3F Canvas and binds GSAP-driven animState to Three.js objects
 */
function SceneContent({ animState, panelRefs, charRef }) {
  const { camera } = useThree();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const s = animState.current;
    if (!s) return;

    // 1. Update Camera Position and lookAt
    if (s.camera) {
      camera.position.set(s.camera.x, s.camera.y, s.camera.z);
      camera.lookAt(0, 0.4, 0);
    }

    // 2. Update Panels with GSAP positions + subtle idle hover
    const isIdle = s.idleActive !== false;
    const wsScale = s.workspaceScale || 1.0;

    panelRefs.current.forEach((panelGroup, i) => {
      if (!panelGroup) return;
      const p = s.panels[i];
      if (!p) return;

      const isGrabbed = p.isGrabbed;
      const idleFloatY =
        isIdle && !isGrabbed
          ? Math.sin(t * 0.7 + i * 0.8) * 0.035 * (s.char?.idleWeight ?? 1)
          : 0;
      const idleRotZ =
        isIdle && !isGrabbed
          ? Math.sin(t * 0.45 + i * 0.8) * 0.008 * (s.char?.idleWeight ?? 1)
          : 0;

      panelGroup.position.set(
        p.pos[0],
        p.pos[1] + idleFloatY,
        p.pos[2]
      );

      panelGroup.rotation.set(
        p.rot[0],
        p.rot[1],
        p.rot[2] + idleRotZ
      );

      panelGroup.scale.set(
        p.scale[0] * wsScale,
        p.scale[1] * wsScale,
        p.scale[2] * wsScale
      );
    });
  });

  return (
    <>
      {/* ── CINEMATIC LIGHTING ── */}
      <ambientLight intensity={0.55} color="#1c1d28" />

      {/* Main Key Light */}
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.35}
        color="#f8f6ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={25}
      />

      {/* Violet Luxury Rim Light (Edge definition for humanoid & glass panels) */}
      <pointLight
        position={[-4.5, 3.5, 2.0]}
        intensity={2.2}
        distance={14}
        color="#7c5cfc"
      />

      {/* Soft Cyan Fill Light */}
      <pointLight
        position={[4.5, 2.5, -1.0]}
        intensity={1.2}
        distance={12}
        color="#06b6d4"
      />

      {/* Atmospheric Fog */}
      <fog attach="fog" args={["#080909", 8, 22]} />

      {/* Ground Grid Floor */}
      <ArchitecturalFloor />

      {/* ── 3D HUMAN CHARACTER (with 2-Bone IK Solver) ── */}
      <HumanCharacter ref={charRef} animState={animState} />

      {/* ── 8 FEATURE PANELS ── */}
      {PANELS.map((panel, i) => (
        <FeaturePanel
          key={panel.id}
          ref={(el) => {
            panelRefs.current[i] = el;
          }}
          id={panel.id}
          label={panel.label}
          category={panel.category}
          color={panel.color}
          grabOffset={panel.grabOffset}
          isGrabbed={animState.current?.panels?.[i]?.isGrabbed}
        />
      ))}

      {/* ── CONNECTION LINES MATRIX ── */}
      <ConnectionLines animState={animState} />
    </>
  );
}

/**
 * Root HeroScene component
 */
export function HeroScene({ containerRef }) {
  const panelRefs = useRef([]);
  const charRef = useRef();

  // Plain JS state object driven by GSAP without triggering React re-renders
  const animState = useRef({
    camera: { x: 0, y: 1.45, z: 6.8 },
    char: {
      bodyRotY: 0,
      idleWeight: 1,
      leftHandTarget: { x: -0.45, y: 0.8, z: 0.1 },
      rightHandTarget: { x: 0.45, y: 0.8, z: 0.1 },
      leftGrasp: 0,
      rightGrasp: 0,
    },
    panels: PANELS.map((p) => ({
      pos: [...p.startPos],
      rot: [...p.startRot],
      scale: [1, 1, 1],
      isGrabbed: false,
    })),
    lines: CONNECTION_LINES.map(() => ({
      opacity: 0,
    })),
    workspaceScale: 1.0,
    idleActive: true,
  });

  // Bind master GSAP scroll timeline
  useHeroAnimation({ containerRef, animState });

  return (
    <WebGLErrorBoundary>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        camera={{ position: [0, 1.45, 6.8], fov: 52 }}
        style={{ width: "100%", height: "100%", background: "#080909" }}
      >
        <Suspense fallback={null}>
          <SceneContent
            animState={animState}
            panelRefs={panelRefs}
            charRef={charRef}
          />
        </Suspense>
      </Canvas>
    </WebGLErrorBoundary>
  );
}

export default HeroScene;
