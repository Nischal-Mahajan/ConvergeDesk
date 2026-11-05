/**
 * Definition of the 8 ConvergeDesk Feature Panels
 * Defines scattered starting positions, grab handle offsets, destination assembled layout coordinates, and theme accents.
 */
export const PANELS = [
  {
    id: "projects",
    label: "Projects & Portfolios",
    category: "WORKSPACE",
    color: "#7c5cfc",
    startPos: [-3.8, 1.8, -1.8],
    startRot: [0.12, 0.35, -0.08],
    grabOffset: [0.95, 0.45, 0], // Offset on panel where hand grabs
    // Assembled layout: top-left quadrant of unified command center
    destPos: [-1.45, 1.05, 1.0],
    destRot: [0.02, 0.08, -0.01],
    hand: "left",
  },
  {
    id: "tasks",
    label: "Sprint Tasks & Kanban",
    category: "EXECUTION",
    color: "#22c55e",
    startPos: [3.9, 1.9, -1.6],
    startRot: [-0.08, -0.38, 0.06],
    grabOffset: [-0.95, 0.45, 0],
    destPos: [1.45, 1.05, 1.0],
    destRot: [0.02, -0.08, 0.01],
    hand: "right",
  },
  {
    id: "whiteboard",
    label: "Architecture Canvas",
    category: "DESIGN",
    color: "#f59e0b",
    startPos: [-4.2, -0.2, -2.2],
    startRot: [0.18, 0.45, 0.04],
    grabOffset: [0.95, 0.3, 0],
    destPos: [-1.45, 0.05, 1.0],
    destRot: [0.0, 0.08, 0.0],
    hand: "left",
  },
  {
    id: "code",
    label: "Live Code Workspace",
    category: "ENGINEERING",
    color: "#06b6d4",
    startPos: [4.4, -0.3, -2.0],
    startRot: [-0.14, -0.42, -0.04],
    grabOffset: [-0.95, 0.3, 0],
    destPos: [1.45, 0.05, 1.0],
    destRot: [0.0, -0.08, 0.0],
    hand: "right",
  },
  {
    id: "documents",
    label: "Specifications & Specs",
    category: "KNOWLEDGE",
    color: "#a78bfa",
    startPos: [-3.6, -1.9, -1.5],
    startRot: [0.22, 0.38, -0.05],
    grabOffset: [0.95, 0.25, 0],
    destPos: [-1.45, -0.95, 1.0],
    destRot: [-0.02, 0.08, 0.01],
    hand: "left",
  },
  {
    id: "meetings",
    label: "Voice & Video Sync",
    category: "COLLABORATION",
    color: "#ec4899",
    startPos: [3.8, -1.8, -1.4],
    startRot: [-0.18, -0.35, 0.08],
    grabOffset: [-0.95, 0.25, 0],
    destPos: [1.45, -0.95, 1.0],
    destRot: [-0.02, -0.08, -0.01],
    hand: "right",
  },
  {
    id: "ai",
    label: "Meeting Intelligence AI",
    category: "SYNTHESIS",
    color: "#8b5cf6",
    startPos: [-2.2, 2.8, -2.4],
    startRot: [0.25, 0.2, 0.04],
    grabOffset: [0.75, 0.4, 0],
    destPos: [-1.45, -1.95, 1.0],
    destRot: [-0.03, 0.06, 0.0],
    hand: "left",
  },
  {
    id: "github",
    label: "GitHub Deployments",
    category: "INTEGRATIONS",
    color: "#e2e8f0",
    startPos: [2.3, 2.7, -2.2],
    startRot: [-0.22, -0.18, -0.04],
    grabOffset: [-0.75, 0.4, 0],
    destPos: [1.45, -1.95, 1.0],
    destRot: [-0.03, -0.06, 0.0],
    hand: "right",
  },
];

/**
 * Logical Connection Lines linking assembled panels
 */
export const CONNECTION_LINES = [
  {
    fromId: "projects",
    toId: "tasks",
    color: "#7c5cfc",
    label: "ROADMAP TO SPRINT",
  },
  {
    fromId: "whiteboard",
    toId: "code",
    color: "#06b6d4",
    label: "ARCH TO IMPLEMENTATION",
  },
  {
    fromId: "documents",
    toId: "ai",
    color: "#a78bfa",
    label: "SPECS TO SYNTHESIS",
  },
  {
    fromId: "meetings",
    toId: "ai",
    color: "#ec4899",
    label: "TRANSCRIPTS TO ACTIONS",
  },
  {
    fromId: "tasks",
    toId: "github",
    color: "#22c55e",
    label: "TASKS TO COMMITS",
  },
];
