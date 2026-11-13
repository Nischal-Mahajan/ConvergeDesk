import { useCallback, useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Line,
  Rect,
  Ellipse,
  Arrow,
  Text,
  Transformer,
  Circle,
  Group,
} from "react-konva";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { getFreshAccessToken, getCurrentUser } from "../../utils/auth";
import "./whiteboard.css";

const USER_COLORS = [
  "#625cf0",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#3b82f6",
];

function getRandomColor(seed) {
  const num = typeof seed === "number" ? seed : Math.floor(Math.random() * 100);
  return USER_COLORS[num % USER_COLORS.length];
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const tools = [
  { id: "select", label: "Select", symbol: "↖" },
  { id: "pen", label: "Pen", symbol: "✎" },
  { id: "eraser", label: "Eraser", symbol: "⌫" },
  { id: "text", label: "Text", symbol: "T" },
  { id: "rectangle", label: "Rectangle", symbol: "▱" },
  { id: "ellipse", label: "Ellipse", symbol: "◯" },
  { id: "arrow", label: "Arrow", symbol: "↗" },
  { id: "line", label: "Line", symbol: "―" },
];

export default function CollaborativeWhiteboard({
  whiteboardId,
  title = "Whiteboard",
  onTitleChange,
  isPanel = false,
}) {
  const [activeTool, setActiveTool] = useState("select");
  const [strokeColor, setStrokeColor] = useState("#625cf0");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [selectedId, setSelectedId] = useState(null);
  const [objects, setObjects] = useState({});
  const [draft, setDraft] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [syncStatus, setSyncStatus] = useState("Connecting...");
  const [collaborators, setCollaborators] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const transformerRef = useRef(null);
  const drawingRef = useRef(false);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const ymapRef = useRef(null);
  const undoManagerRef = useRef(null);
  const currentUserRef = useRef(getCurrentUser());
  const userColorRef = useRef(getRandomColor(currentUserRef.current.id));

  // Initialize Yjs and HocuspocusProvider
  useEffect(() => {
    if (!whiteboardId) return;

    let disposed = false;
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const ymap = ydoc.getMap("whiteboard-objects");
    ymapRef.current = ymap;

    const undoManager = new Y.UndoManager(ymap);
    undoManagerRef.current = undoManager;

    const updateUndoRedoState = () => {
      setCanUndo(undoManager.undoStack.length > 0);
      setCanRedo(undoManager.redoStack.length > 0);
    };

    undoManager.on("stack-item-added", updateUndoRedoState);
    undoManager.on("stack-item-popped", updateUndoRedoState);

    // Initial load from local Y.Map
    setObjects(ymap.toJSON());

    // Observe changes to shared Y.Map
    const handleMapChange = () => {
      if (disposed) return;
      setObjects(ymap.toJSON());
      updateUndoRedoState();
    };
    ymap.observe(handleMapChange);

    const provider = new HocuspocusProvider({
      url: "ws://localhost:1234",
      name: `convergedesk-whiteboard-${whiteboardId}`,
      document: ydoc,
      token: getFreshAccessToken,
    });
    providerRef.current = provider;

    // Set initial awareness state
    provider.awareness.setLocalStateField("user", {
      name: currentUserRef.current.username,
      color: userColorRef.current,
      id: currentUserRef.current.id,
    });

    const handleStatus = ({ status }) => {
      if (disposed) return;
      if (status === "connected") {
        setSyncStatus("Connected");
      } else if (status === "connecting") {
        setSyncStatus("Connecting...");
      } else if (status === "disconnected") {
        setSyncStatus("Disconnected");
      }
    };

    const handleSynced = () => {
      if (disposed) return;
      setSyncStatus("Saved to server");
    };

    const handleAwarenessChange = () => {
      if (disposed) return;
      const states = provider.awareness.getStates();
      const activeCollabs = [];
      const cursors = {};

      states.forEach((state, clientID) => {
        if (clientID === provider.awareness.clientID) return;
        if (state.user) {
          activeCollabs.push({ clientID, ...state.user });
        }
        if (state.cursor && state.user) {
          cursors[clientID] = {
            ...state.cursor,
            name: state.user.name,
            color: state.user.color,
          };
        }
      });

      setCollaborators(activeCollabs);
      setRemoteCursors(cursors);
    };

    provider.on("status", handleStatus);
    provider.on("synced", handleSynced);
    provider.awareness.on("change", handleAwarenessChange);

    return () => {
      disposed = true;
      provider.off("status", handleStatus);
      provider.off("synced", handleSynced);
      provider.awareness.off("change", handleAwarenessChange);
      ymap.unobserve(handleMapChange);
      undoManager.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [whiteboardId]);

  // Track container dimensions with ResizeObserver
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(100, entry.contentRect.width);
      const height = Math.max(100, entry.contentRect.height);
      setCanvasSize({ width, height });
      setIsCollapsed(width < 500);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Update Konva Transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    if (selectedId && activeTool === "select") {
      const selectedNode = stageRef.current.findOne(`#node-${selectedId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
        return;
      }
    }
    transformerRef.current.nodes([]);
    transformerRef.current.getLayer().batchDraw();
  }, [selectedId, activeTool, objects]);

  // Coordinate helper taking zoom and pan into account
  const getRelativePointerPosition = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;

    return {
      x: (pointer.x - stage.x()) / zoom,
      y: (pointer.y - stage.y()) / zoom,
    };
  };

  // Broadcast cursor position via Yjs Awareness
  const broadcastCursor = (pos) => {
    if (!providerRef.current?.awareness || !pos) return;
    providerRef.current.awareness.setLocalStateField("cursor", {
      x: pos.x,
      y: pos.y,
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          undoManagerRef.current?.redo();
        } else {
          undoManagerRef.current?.undo();
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        undoManagerRef.current?.redo();
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        deleteSelected();
        return;
      }

      if (event.key === "Escape") {
        setSelectedId(null);
        setDraft(null);
        drawingRef.current = false;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  const deleteSelected = () => {
    if (!selectedId || !ymapRef.current) return;
    ymapRef.current.delete(selectedId);
    setSelectedId(null);
  };

  const handlePointerDown = (e) => {
    const stage = stageRef.current;
    const isBackground = e.target === stage;

    if (activeTool === "select") {
      if (isBackground) setSelectedId(null);
      return;
    }

    const pos = getRelativePointerPosition();
    if (!pos) return;

    if (activeTool === "text") {
      const text = window.prompt("Enter text:");
      if (text?.trim()) {
        const id = createId();
        const item = {
          id,
          type: "text",
          x: pos.x,
          y: pos.y,
          text: text.trim(),
          color: strokeColor,
          fontSize: 20,
          createdBy: currentUserRef.current.username,
        };
        ymapRef.current?.set(id, item);
      }
      return;
    }

    drawingRef.current = true;
    setSelectedId(null);

    const item = {
      id: createId(),
      type: activeTool,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      color: strokeColor,
      strokeWidth: activeTool === "eraser" ? 20 : strokeWidth,
      createdBy: currentUserRef.current.username,
    };

    if (activeTool === "pen" || activeTool === "eraser") {
      item.points = [pos.x, pos.y];
    }

    setDraft(item);
  };

  const handlePointerMove = () => {
    const pos = getRelativePointerPosition();
    if (!pos) return;

    broadcastCursor(pos);

    if (!drawingRef.current || !draft) return;

    setDraft((curr) => {
      if (!curr) return null;
      if (curr.type === "pen" || curr.type === "eraser") {
        return {
          ...curr,
          points: [...curr.points, pos.x, pos.y],
        };
      }
      return {
        ...curr,
        width: pos.x - curr.x,
        height: pos.y - curr.y,
      };
    });
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    if (!draft || !ymapRef.current) {
      setDraft(null);
      return;
    }

    if (draft.type === "eraser") {
      // Perform eraser collision
      const eraserRadius = draft.strokeWidth / 2;
      const points = draft.points || [];

      Object.entries(objects).forEach(([id, obj]) => {
        let hit = false;
        if (obj.points) {
          for (let i = 0; i < obj.points.length; i += 2) {
            for (let j = 0; j < points.length; j += 2) {
              const dx = obj.points[i] - points[j];
              const dy = obj.points[i + 1] - points[j + 1];
              if (Math.hypot(dx, dy) < eraserRadius + 6) {
                hit = true;
                break;
              }
            }
            if (hit) break;
          }
        } else {
          const x = obj.x;
          const y = obj.y;
          const w = obj.width || 0;
          const h = obj.height || 0;

          hit = points.some((_, i) => {
            if (i % 2 !== 0) return false;
            const px = points[i];
            const py = points[i + 1];
            return (
              px >= Math.min(x, x + w) - eraserRadius &&
              px <= Math.max(x, x + w) + eraserRadius &&
              py >= Math.min(y, y + h) - eraserRadius &&
              py <= Math.max(y, y + h) + eraserRadius
            );
          });
        }

        if (hit) {
          ymapRef.current.delete(id);
        }
      });

      setDraft(null);
      return;
    }

    const isValid =
      draft.type === "pen" ||
      draft.type === "text" ||
      Math.abs(draft.width) > 3 ||
      Math.abs(draft.height) > 3;

    if (isValid) {
      ymapRef.current.set(draft.id, draft);
    }

    setDraft(null);
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.05;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.2, Math.min(3, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setZoom(newScale);
    setStagePos(newPos);
  };

  const resetView = () => {
    setZoom(1);
    setStagePos({ x: 0, y: 0 });
  };

  const fitToContent = () => {
    const items = Object.values(objects);
    if (!items.length) {
      resetView();
      return;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    items.forEach((item) => {
      if (item.points) {
        for (let i = 0; i < item.points.length; i += 2) {
          minX = Math.min(minX, item.points[i]);
          maxX = Math.max(maxX, item.points[i]);
          minY = Math.min(minY, item.points[i + 1]);
          maxY = Math.max(maxY, item.points[i + 1]);
        }
      } else {
        const x = item.x || 0;
        const y = item.y || 0;
        const w = item.width || 50;
        const h = item.height || 50;
        minX = Math.min(minX, x, x + w);
        maxX = Math.max(maxX, x, x + w);
        minY = Math.min(minY, y, y + h);
        maxY = Math.max(maxY, y, y + h);
      }
    });

    const contentWidth = Math.max(50, maxX - minX);
    const contentHeight = Math.max(50, maxY - minY);
    const scale = Math.min(
      (canvasSize.width - 80) / contentWidth,
      (canvasSize.height - 80) / contentHeight,
      1.5
    );

    setZoom(Math.max(0.3, scale));
    setStagePos({
      x: (canvasSize.width - contentWidth * scale) / 2 - minX * scale,
      y: (canvasSize.height - contentHeight * scale) / 2 - minY * scale,
    });
  };

  const updateObject = (id, patch) => {
    if (!ymapRef.current) return;
    const existing = ymapRef.current.get(id);
    if (existing) {
      ymapRef.current.set(id, { ...existing, ...patch });
    }
  };

  const renderShape = (item) => {
    const isSelected = selectedId === item.id;
    const draggable = activeTool === "select";

    const common = {
      key: item.id,
      id: `node-${item.id}`,
      draggable,
      onClick: () => {
        if (activeTool === "select") setSelectedId(item.id);
      },
      onTap: () => {
        if (activeTool === "select") setSelectedId(item.id);
      },
      onDragEnd: (e) => {
        updateObject(item.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      },
      onTransformEnd: (e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        updateObject(item.id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(5, (item.width || 50) * scaleX),
          height: Math.max(5, (item.height || 50) * scaleY),
        });
      },
    };

    if (item.type === "pen" || item.type === "eraser") {
      return (
        <Line
          {...common}
          points={item.points}
          stroke={item.type === "eraser" ? "#ffffff" : item.color}
          strokeWidth={item.strokeWidth}
          lineCap="round"
          lineJoin="round"
          tension={0.2}
          hitStrokeWidth={16}
          shadowColor={isSelected ? "#625cf0" : undefined}
          shadowBlur={isSelected ? 6 : 0}
        />
      );
    }

    if (item.type === "rectangle") {
      return (
        <Rect
          {...common}
          x={item.x}
          y={item.y}
          width={Math.abs(item.width)}
          height={Math.abs(item.height)}
          offsetX={item.width < 0 ? Math.abs(item.width) : 0}
          offsetY={item.height < 0 ? Math.abs(item.height) : 0}
          stroke={item.color}
          strokeWidth={item.strokeWidth}
          cornerRadius={4}
          shadowColor={isSelected ? "#625cf0" : undefined}
          shadowBlur={isSelected ? 6 : 0}
        />
      );
    }

    if (item.type === "ellipse") {
      return (
        <Ellipse
          {...common}
          x={item.x + item.width / 2}
          y={item.y + item.height / 2}
          radiusX={Math.max(1, Math.abs(item.width) / 2)}
          radiusY={Math.max(1, Math.abs(item.height) / 2)}
          stroke={item.color}
          strokeWidth={item.strokeWidth}
          shadowColor={isSelected ? "#625cf0" : undefined}
          shadowBlur={isSelected ? 6 : 0}
        />
      );
    }

    if (item.type === "arrow" || item.type === "line") {
      return (
        <Arrow
          {...common}
          points={[
            item.x,
            item.y,
            item.x + item.width,
            item.y + item.height,
          ]}
          stroke={item.color}
          fill={item.color}
          strokeWidth={item.strokeWidth}
          pointerLength={item.type === "arrow" ? 10 : 0}
          pointerWidth={item.type === "arrow" ? 10 : 0}
          shadowColor={isSelected ? "#625cf0" : undefined}
          shadowBlur={isSelected ? 6 : 0}
        />
      );
    }

    if (item.type === "text") {
      return (
        <Text
          {...common}
          x={item.x}
          y={item.y}
          text={item.text}
          fontSize={item.fontSize || 20}
          fill={item.color}
          padding={4}
          shadowColor={isSelected ? "#625cf0" : undefined}
          shadowBlur={isSelected ? 6 : 0}
        />
      );
    }

    return null;
  };

  const objectList = Object.values(objects);
  if (draft) objectList.push(draft);

  return (
    <div className={`whiteboard-container ${isPanel ? "panel-mode" : ""}`}>
      {/* Top Header Bar */}
      <header className="whiteboard-topbar">
        <div className="whiteboard-title-group">
          <strong>{title}</strong>
          <span className={`sync-badge sync-${syncStatus.toLowerCase().replace(/\s+/g, "-")}`}>
            ● {syncStatus}
          </span>
        </div>

        {/* Collaborators list */}
        <div className="collaborators-badge-group">
          <span
            className="user-pill my-pill"
            style={{ backgroundColor: userColorRef.current }}
            title={`You: ${currentUserRef.current.username}`}
          >
            {currentUserRef.current.username?.[0]?.toUpperCase() || "U"}
          </span>
          {collaborators.map((c) => (
            <span
              key={c.clientID}
              className="user-pill"
              style={{ backgroundColor: c.color }}
              title={c.name}
            >
              {c.name?.[0]?.toUpperCase() || "C"}
            </span>
          ))}
          {collaborators.length > 0 && (
            <small className="collaborator-count">
              +{collaborators.length} online
            </small>
          )}
        </div>

        {/* Zoom & View Controls */}
        <div className="whiteboard-view-controls">
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
            title="Zoom Out"
          >
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            title="Zoom In"
          >
            +
          </button>
          <button onClick={resetView} title="Reset Zoom">
            Reset
          </button>
          <button onClick={fitToContent} title="Fit to all elements">
            Fit
          </button>
        </div>
      </header>

      {/* Main workspace section */}
      <div className="whiteboard-workspace">
        {/* Floating Tool Palette */}
        <aside className={`whiteboard-palette ${isCollapsed ? "collapsed" : ""}`}>
          <div className="palette-tools">
            {tools.map((t) => (
              <button
                key={t.id}
                className={`palette-btn ${activeTool === t.id ? "active" : ""}`}
                onClick={() => {
                  setActiveTool(t.id);
                  if (t.id !== "select") setSelectedId(null);
                }}
                title={t.label}
              >
                <span className="tool-symbol">{t.symbol}</span>
                {!isCollapsed && <span className="tool-label">{t.label}</span>}
              </button>
            ))}
          </div>

          <div className="palette-separator" />

          {/* Color & Width controls */}
          <div className="palette-styles">
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="palette-color-picker"
              title="Stroke Color"
            />
          </div>

          <div className="palette-separator" />

          {/* Undo, Redo, Delete */}
          <div className="palette-actions">
            <button
              className="palette-btn"
              onClick={() => undoManagerRef.current?.undo()}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <span className="tool-symbol">↶</span>
              {!isCollapsed && <span className="tool-label">Undo</span>}
            </button>
            <button
              className="palette-btn"
              onClick={() => undoManagerRef.current?.redo()}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              <span className="tool-symbol">↷</span>
              {!isCollapsed && <span className="tool-label">Redo</span>}
            </button>
            <button
              className="palette-btn delete-btn"
              onClick={deleteSelected}
              disabled={!selectedId}
              title="Delete Selected (Del)"
            >
              <span className="tool-symbol">🗑</span>
              {!isCollapsed && <span className="tool-label">Delete</span>}
            </button>
          </div>
        </aside>

        {/* Canvas Area */}
        <div
          className="whiteboard-canvas-wrapper"
          ref={canvasRef}
        >
          <Stage
            ref={stageRef}
            width={canvasSize.width}
            height={canvasSize.height}
            scaleX={zoom}
            scaleY={zoom}
            x={stagePos.x}
            y={stagePos.y}
            draggable={activeTool === "select" && !selectedId}
            onDragEnd={(e) => {
              if (e.target === stageRef.current) {
                setStagePos({ x: e.target.x(), y: e.target.y() });
              }
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* Shapes Layer */}
            <Layer>
              {objectList.map(renderShape)}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Layer>

            {/* Remote Cursors Layer */}
            <Layer listening={false}>
              {Object.entries(remoteCursors).map(([clientId, c]) => (
                <Group key={clientId} x={c.x} y={c.y}>
                  <Circle radius={4} fill={c.color || "#ef4444"} />
                  <Text
                    text={c.name || "Collaborator"}
                    fontSize={11}
                    fill="#ffffff"
                    padding={3}
                    x={8}
                    y={-10}
                    shadowColor="rgba(0,0,0,0.4)"
                    shadowBlur={4}
                  />
                </Group>
              ))}
            </Layer>
          </Stage>

          {objectList.length === 0 && !draft && (
            <div className="canvas-empty-overlay">
              <h3>Collaborative Whiteboard</h3>
              <p>Pick a tool from the palette to start drawing together in real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
