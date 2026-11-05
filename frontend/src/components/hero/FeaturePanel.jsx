import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";

/**
 * High-fidelity 3D Interface Panels representing actual ConvergeDesk tools.
 * Each panel features detailed UI layout, window chrome, and an illuminated grab handle.
 */
export const FeaturePanel = forwardRef(function FeaturePanel(
  { id, label, category, color, grabOffset, isGrabbed },
  ref
) {
  const panelWidth = 2.4;
  const panelHeight = 1.35;

  // Glass and UI Materials
  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0a0b10",
        roughness: 0.12,
        metalness: 0.35,
        transparent: true,
        opacity: 0.94,
      }),
    []
  );

  const headerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#12141c",
        roughness: 0.25,
        metalness: 0.4,
      }),
    []
  );

  const borderMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.2),
        transparent: true,
        opacity: 0.4,
      }),
    [color]
  );

  const accentMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        toneMapped: false,
      }),
    [color]
  );

  // Border wireframe geometry
  const borderGeo = useMemo(() => {
    const halfW = panelWidth / 2;
    const halfH = panelHeight / 2;
    const points = [
      new THREE.Vector3(-halfW, halfH, 0.01),
      new THREE.Vector3(halfW, halfH, 0.01),
      new THREE.Vector3(halfW, -halfH, 0.01),
      new THREE.Vector3(-halfW, -halfH, 0.01),
      new THREE.Vector3(-halfW, halfH, 0.01),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <group ref={ref}>
      {/* ── BASE PANEL GLASS & BORDER ── */}
      <mesh material={glassMat} castShadow receiveShadow>
        <planeGeometry args={[panelWidth, panelHeight]} />
      </mesh>
      <lineSegments geometry={borderGeo} material={borderMat} />

      {/* ── WINDOW TITLEBAR ── */}
      <group position={[0, panelHeight / 2 - 0.14, 0.015]}>
        <mesh material={headerMat}>
          <planeGeometry args={[panelWidth, 0.28]} />
        </mesh>
        {/* Window controls (3 micro dots) */}
        {[-0.07, -0.025, 0.02].map((x, i) => (
          <mesh
            key={i}
            position={[-panelWidth / 2 + 0.18 + x, 0, 0.01]}
            material={
              i === 0
                ? new THREE.MeshBasicMaterial({ color: "#ef4444" })
                : i === 1
                ? new THREE.MeshBasicMaterial({ color: "#f59e0b" })
                : new THREE.MeshBasicMaterial({ color: "#10b981" })
            }
          >
            <circleGeometry args={[0.024, 16]} />
          </mesh>
        ))}

        {/* Panel title text */}
        <Text
          position={[-panelWidth / 2 + 0.38, 0, 0.02]}
          fontSize={0.075}
          color="#f0efe9"
          anchorX="left"
          anchorY="middle"
        >
          {label}
        </Text>

        {/* Category tag pill */}
        <group position={[panelWidth / 2 - 0.38, 0, 0.02]}>
          <mesh material={accentMat}>
            <planeGeometry args={[0.42, 0.12]} />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.048}
            color="#080909"
            anchorX="center"
            anchorY="middle"
            fontStyle="bold"
          >
            {category}
          </Text>
        </group>
      </group>

      {/* ── FEATURE-SPECIFIC REALISTIC UI CONTENT ── */}
      <group position={[0, -0.12, 0.02]}>
        {id === "projects" && <ProjectsUI accentMat={accentMat} />}
        {id === "tasks" && <TasksUI accentMat={accentMat} />}
        {id === "whiteboard" && <WhiteboardUI accentMat={accentMat} />}
        {id === "code" && <CodeUI />}
        {id === "documents" && <DocumentsUI />}
        {id === "meetings" && <MeetingsUI accentMat={accentMat} />}
        {id === "ai" && <AiUI accentMat={accentMat} />}
        {id === "github" && <GithubUI />}
      </group>

      {/* ── TACTILE GRAB HANDLE (Physical Interaction Point) ── */}
      {grabOffset && (
        <group position={[grabOffset[0], grabOffset[1], 0.03]}>
          <mesh
            material={
              new THREE.MeshStandardMaterial({
                color: isGrabbed ? "#ffffff" : color,
                emissive: color,
                emissiveIntensity: isGrabbed ? 1.0 : 0.6,
                roughness: 0.1,
              })
            }
          >
            <boxGeometry args={[0.08, 0.28, 0.05]} />
          </mesh>
          <mesh
            position={[0, 0, 0.03]}
            material={new THREE.MeshBasicMaterial({ color: "#ffffff" })}
          >
            <sphereGeometry args={[0.02, 12, 12]} />
          </mesh>
        </group>
      )}
    </group>
  );
});

/* ── 1. Projects Portfolio UI ── */
function ProjectsUI({ accentMat }) {
  return (
    <group position={[-0.95, 0.38, 0]}>
      <Text position={[0, 0, 0]} fontSize={0.085} color="#f0efe9" anchorX="left">
        Platform Core Engine
      </Text>
      <Text position={[0, -0.14, 0]} fontSize={0.055} color="#72737c" anchorX="left">
        Milestone: Q4 Architecture Transition · 82% complete
      </Text>
      {/* Progress track */}
      <group position={[0.95, -0.28, 0]}>
        <mesh position={[0, 0, 0]} material={new THREE.MeshBasicMaterial({ color: "#222430" })}>
          <planeGeometry args={[1.9, 0.08]} />
        </mesh>
        <mesh position={[-0.95 + 1.55 / 2, 0, 0.005]} material={accentMat}>
          <planeGeometry args={[1.55, 0.08]} />
        </mesh>
      </group>
      {/* Project metrics */}
      <group position={[0, -0.46, 0]}>
        <Text position={[0, 0, 0]} fontSize={0.06} color="#7c5cfc" anchorX="left">
          24 Repositories
        </Text>
        <Text position={[0.7, 0, 0]} fontSize={0.06} color="#22c55e" anchorX="left">
          98.4% Health
        </Text>
        <Text position={[1.4, 0, 0]} fontSize={0.06} color="#f0efe9" anchorX="left">
          14 Contributors
        </Text>
      </group>
    </group>
  );
}

/* ── 2. Sprint Tasks & Kanban UI ── */
function TasksUI({ accentMat }) {
  return (
    <group position={[-0.95, 0.38, 0]}>
      {/* 2 Kanban Columns */}
      {["IN PROGRESS", "READY FOR REVIEW"].map((col, ci) => (
        <group key={ci} position={[ci * 1.05, 0, 0]}>
          <Text position={[0, 0, 0]} fontSize={0.06} color="#72737c" anchorX="left">
            {col}
          </Text>
          {/* Card 1 */}
          <group position={[0.45, -0.22, 0]}>
            <mesh material={new THREE.MeshBasicMaterial({ color: "#161822" })}>
              <planeGeometry args={[0.9, 0.32]} />
            </mesh>
            <Text position={[-0.38, 0.07, 0.01]} fontSize={0.055} color="#f0efe9" anchorX="left">
              {ci === 0 ? "CD-842 Realtime Yjs" : "CD-839 Token Auth"}
            </Text>
            <mesh position={[-0.3, -0.08, 0.01]} material={accentMat}>
              <planeGeometry args={[0.24, 0.065]} />
            </mesh>
            <Text position={[-0.3, -0.08, 0.02]} fontSize={0.04} color="#080909" anchorX="center" anchorY="middle">
              {ci === 0 ? "HIGH" : "MERGED"}
            </Text>
          </group>
        </group>
      ))}
    </group>
  );
}

/* ── 3. Architecture Whiteboard UI ── */
function WhiteboardUI({ accentMat }) {
  return (
    <group position={[-0.95, 0.38, 0]}>
      {/* Node 1: API Gateway */}
      <group position={[0.3, -0.22, 0]}>
        <mesh material={new THREE.MeshBasicMaterial({ color: "#1a1c28" })}>
          <planeGeometry args={[0.55, 0.28]} />
        </mesh>
        <Text position={[0, 0, 0.01]} fontSize={0.055} color="#f0efe9" anchorX="center" anchorY="middle">
          Gateway API
        </Text>
      </group>
      {/* Connecting Arrow */}
      <mesh position={[0.75, -0.22, 0]} material={accentMat}>
        <planeGeometry args={[0.3, 0.02]} />
      </mesh>
      {/* Node 2: Realtime Sync */}
      <group position={[1.2, -0.22, 0]}>
        <mesh material={new THREE.MeshBasicMaterial({ color: "#1a1c28" })}>
          <planeGeometry args={[0.55, 0.28]} />
        </mesh>
        <Text position={[0, 0, 0.01]} fontSize={0.055} color="#f59e0b" anchorX="center" anchorY="middle">
          Sync Engine
        </Text>
      </group>
      <Text position={[0, -0.52, 0]} fontSize={0.055} color="#72737c" anchorX="left">
        4 Whiteboard Decision Nodes Synchronized
      </Text>
    </group>
  );
}

/* ── 4. Code Workspace UI ── */
function CodeUI() {
  const codeLines = [
    { num: "01", text: "import { createWorkspace } from '@convergedesk/core';", kw: true },
    { num: "02", text: "export async function syncEngineering() {", kw: true },
    { num: "03", text: "  const session = await connectSession({ live: true });", kw: false },
    { num: "04", text: "  return session.subscribe(Tasks.stream);", kw: false },
    { num: "05", text: "}", kw: true },
  ];

  return (
    <group position={[-1.0, 0.38, 0]}>
      {codeLines.map((line, li) => (
        <group key={li} position={[0, -li * 0.11, 0]}>
          <Text position={[0, 0, 0]} fontSize={0.055} color="#454756" anchorX="left">
            {line.num}
          </Text>
          <Text position={[0.15, 0, 0]} fontSize={0.055} color={line.kw ? "#06b6d4" : "#e2e8f0"} anchorX="left">
            {line.text}
          </Text>
        </group>
      ))}
    </group>
  );
}

/* ── 5. Specifications & Documents UI ── */
function DocumentsUI() {
  return (
    <group position={[-0.95, 0.38, 0]}>
      <Text position={[0, 0, 0]} fontSize={0.08} color="#f0efe9" anchorX="left">
        # System Architecture RFC-24
      </Text>
      <Text position={[0, -0.16, 0]} fontSize={0.055} color="#72737c" anchorX="left">
        Engineering consensus finalized. 3 decisions bound to sprints.
      </Text>
      {/* Document checklist */}
      {["✓ CRDT Consensus Protocol", "✓ Cross-region Redis clusters", "✓ End-to-end data encryption"].map(
        (item, i) => (
          <Text key={i} position={[0, -0.28 - i * 0.1, 0]} fontSize={0.055} color="#a78bfa" anchorX="left">
            {item}
          </Text>
        )
      )}
    </group>
  );
}

/* ── 6. Voice & Video Sync UI ── */
function MeetingsUI({ accentMat }) {
  return (
    <group position={[-0.95, 0.38, 0]}>
      <group position={[0, 0, 0]}>
        <mesh position={[0.42, -0.18, 0]} material={new THREE.MeshBasicMaterial({ color: "#161824" })}>
          <planeGeometry args={[0.85, 0.44]} />
        </mesh>
        <Text position={[0.42, -0.18, 0.01]} fontSize={0.06} color="#ec4899" anchorX="center" anchorY="middle">
          Lead Architect (Speaking)
        </Text>
        <mesh position={[1.4, -0.18, 0]} material={new THREE.MeshBasicMaterial({ color: "#161824" })}>
          <planeGeometry args={[0.85, 0.44]} />
        </mesh>
        <Text position={[1.4, -0.18, 0.01]} fontSize={0.06} color="#f0efe9" anchorX="center" anchorY="middle">
          Staff Engineer
        </Text>
      </group>
      {/* Waveform bars */}
      <group position={[0.95, -0.48, 0]}>
        {[-0.4, -0.2, 0, 0.2, 0.4].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} material={accentMat}>
            <planeGeometry args={[0.04, 0.06 + Math.abs(Math.sin(i * 1.5)) * 0.08]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ── 7. AI Intelligence UI ── */
function AiUI({ accentMat }) {
  return (
    <group position={[-0.95, 0.38, 0]}>
      <Text position={[0, 0, 0]} fontSize={0.075} color="#8b5cf6" anchorX="left">
        ✦ AI Executive Summary
      </Text>
      <Text position={[0, -0.14, 0]} fontSize={0.055} color="#f0efe9" anchorX="left">
        "Sprint 24 velocity increased by 38% after converging docs & tasks."
      </Text>
      <group position={[0, -0.32, 0]}>
        <mesh position={[0.45, 0, 0]} material={accentMat}>
          <planeGeometry args={[0.9, 0.14]} />
        </mesh>
        <Text position={[0.45, 0, 0.01]} fontSize={0.055} color="#080909" anchorX="center" anchorY="middle" fontStyle="bold">
          3 Action Items Extracted
        </Text>
      </group>
    </group>
  );
}

/* ── 8. GitHub Activity UI ── */
function GithubUI() {
  return (
    <group position={[-0.95, 0.38, 0]}>
      <Text position={[0, 0, 0]} fontSize={0.075} color="#f0efe9" anchorX="left">
        convergedesk / main @ c8921df
      </Text>
      <Text position={[0, -0.14, 0]} fontSize={0.055} color="#22c55e" anchorX="left">
        ✓ Pull Request #142 Merged into production
      </Text>
      <group position={[0, -0.28, 0]}>
        <Text position={[0, 0, 0]} fontSize={0.055} color="#72737c" anchorX="left">
          +482 lines · -38 lines · 12 commits verified
        </Text>
      </group>
      {/* Branch line */}
      <group position={[0.95, -0.42, 0]}>
        <mesh position={[-0.4, 0, 0]} material={new THREE.MeshBasicMaterial({ color: "#22c55e" })}>
          <circleGeometry args={[0.035, 16]} />
        </mesh>
        <mesh position={[0, 0, 0]} material={new THREE.MeshBasicMaterial({ color: "#3a3c4c" })}>
          <planeGeometry args={[0.7, 0.02]} />
        </mesh>
        <mesh position={[0.4, 0, 0]} material={new THREE.MeshBasicMaterial({ color: "#7c5cfc" })}>
          <circleGeometry args={[0.035, 16]} />
        </mesh>
      </group>
    </group>
  );
}
