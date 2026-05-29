import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PivotControls, Sphere, Cylinder, Box, Grid, Html } from "@react-three/drei";
import { create } from "zustand";
import * as THREE from "three";
import "./styles.css";

const cloneScene = () => ({
  rootId: "tavern",
  selectedNodeId: "ember",
  nodes: {
    tavern: {
      id: "tavern",
      type: "environment",
      name: "The EmberHeart Tavern",
      description:
        "A warm, system-agnostic gathering node built around a heart-shaped coal furnace. Every chair, keepsake, rumor, and character can become part of the shared scene graph.",
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      extras: {
        source: "mock-gltf",
        lightingMood: "amber hearthlight",
        wikiSlug: "nodes/emberheart-tavern",
        permissions: ["move-props", "edit-descriptions"]
      },
      children: ["ember", "table", "notice-board"]
    },
    ember: {
      id: "ember",
      type: "character",
      name: "Ember Quickstep",
      description:
        "A tavern guide NPC with ash-gray curls, a copper ledger, and an alarming talent for remembering which adventurer left which cursed umbrella by the door.",
      position: [-2.2, 0.72, -0.8],
      rotation: [0, 0.4, 0],
      extras: {
        pronouns: "she/they",
        role: "NPC host",
        tags: ["guide", "quest-hook", "friendly"],
        importedFrom: "characters/ember.quickstep.glb"
      },
      children: ["ledger"]
    },
    ledger: {
      id: "ledger",
      type: "item",
      name: "Copper-Bound Ledger",
      description:
        "A shared campaign notebook masquerading as an in-world prop. Its entries can point to people, rumors, inventory, or other nested objects.",
      position: [0.48, -0.2, 0.12],
      rotation: [0.2, 0.1, -0.35],
      extras: {
        pages: 42,
        schema: "freeform-text",
        backlinks: ["notice-board", "table"]
      },
      children: []
    },
    table: {
      id: "table",
      type: "item",
      name: "Round Strategy Table",
      description:
        "A heavy table used for maps, snacks, and dramatic accusations. Children nested under it stay spatially attached as the table moves.",
      position: [0.9, 0.34, 0.55],
      rotation: [0, -0.2, 0],
      extras: {
        material: "scarred oak",
        supportsDropZones: true,
        inventoryMode: "container"
      },
      children: ["map", "dice"]
    },
    map: {
      id: "map",
      type: "item",
      name: "Tea-Stained Valley Map",
      description:
        "A flat prop nested on the table. Move the table and the map follows, because its transform is relative to its parent group.",
      position: [-0.28, 0.33, 0.03],
      rotation: [Math.PI / 2, 0, 0.1],
      extras: {
        region: "The Glassfen Road",
        scale: "narrative",
        fogOfWar: false
      },
      children: []
    },
    dice: {
      id: "dice",
      type: "item",
      name: "Bone Dice Cup",
      description:
        "A rules-neutral token. It can exist in the scene without knowing what system, roll formula, or table convention it belongs to.",
      position: [0.42, 0.34, -0.12],
      rotation: [0, 0, 0],
      extras: {
        contains: ["d6", "d20", "coin"],
        owner: "unclaimed"
      },
      children: []
    },
    "notice-board": {
      id: "notice-board",
      type: "item",
      name: "Rumor Notice Board",
      description:
        "A public wiki surface where table lore accretes organically: jobs, warnings, missing cats, and suspiciously specific prophecy fragments.",
      position: [2.8, 1.05, -1.45],
      rotation: [0, -0.45, 0],
      extras: {
        pinCount: 9,
        canonicalPage: "wiki/rumor-board",
        acceptsChildren: true
      },
      children: []
    }
  }
});

const useRoomStore = create((set) => ({
  ...cloneScene(),
  viewMode: "mixed",
  expandedIds: new Set(["tavern", "ember", "table"]),
  selectNode: (id) => set({ selectedNodeId: id }),
  setViewMode: (viewMode) => set({ viewMode }),
  toggleExpanded: (id) =>
    set((state) => {
      const expandedIds = new Set(state.expandedIds);
      expandedIds.has(id) ? expandedIds.delete(id) : expandedIds.add(id);
      return { expandedIds };
    }),
  updateNodePosition: (id, position) =>
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: {
          ...state.nodes[id],
          position
        }
      }
    })),
  updateNodeDescription: (id, description) =>
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: {
          ...state.nodes[id],
          description
        }
      }
    })),
  resetScene: () => set(cloneScene())
}));

function PlaceholderModel({ node, selected }) {
  const commonMaterial = {
    roughness: 0.62,
    metalness: 0.08,
    color: selected ? "#f6c453" : node.type === "character" ? "#67e8f9" : "#f97316"
  };

  if (node.type === "environment") {
    return (
      <>
        <Box args={[7.2, 0.18, 5.2]} position={[0, -0.1, 0]}>
          <meshStandardMaterial color={selected ? "#4f46e5" : "#1f2937"} roughness={0.9} />
        </Box>
        <Box args={[1.15, 1.25, 0.22]} position={[0, 0.55, -2.35]}>
          <meshStandardMaterial color="#7c2d12" emissive="#451a03" emissiveIntensity={0.2} />
        </Box>
      </>
    );
  }

  if (node.type === "character") {
    return (
      <>
        <Sphere args={[0.35, 32, 24]} position={[0, 0.34, 0]}>
          <meshStandardMaterial {...commonMaterial} />
        </Sphere>
        <Sphere args={[0.18, 24, 16]} position={[0, 0.82, 0]}>
          <meshStandardMaterial color={selected ? "#fde68a" : "#fda4af"} roughness={0.45} />
        </Sphere>
      </>
    );
  }

  return (
    <Cylinder args={[0.24, 0.3, 0.65, 24]} position={[0, 0.32, 0]}>
      <meshStandardMaterial {...commonMaterial} />
    </Cylinder>
  );
}

function SceneNode({ id, depth = 0 }) {
  const node = useRoomStore((state) => state.nodes[id]);
  const selectedNodeId = useRoomStore((state) => state.selectedNodeId);
  const selectNode = useRoomStore((state) => state.selectNode);
  const updateNodePosition = useRoomStore((state) => state.updateNodePosition);
  const dragMatrix = useMemo(() => new THREE.Matrix4(), []);
  const dragPosition = useMemo(() => new THREE.Vector3(), []);
  const dragQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const dragScale = useMemo(() => new THREE.Vector3(), []);
  const isSelected = selectedNodeId === id;

  if (!node) return null;

  const content = (
    <group
      position={node.position}
      rotation={node.rotation}
      onClick={(event) => {
        event.stopPropagation();
        selectNode(id);
      }}
    >
      <PlaceholderModel node={node} selected={isSelected} />
      <Html position={[0, node.type === "environment" ? 0.3 : 0.95, 0]} center distanceFactor={8}>
        <button
          className={`scene-label ${isSelected ? "is-selected" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            selectNode(id);
          }}
        >
          {node.name}
        </button>
      </Html>

      {/*
        Recursive scene graph rendering:
        The Zustand store is flat, but each node lists child IDs. Rendering each child
        inside this parent <group> makes child transforms local to the parent, exactly
        like a glTF scene graph. If "Ember" moves, the nested "Ledger" follows because
        its position is evaluated relative to Ember's group rather than world space.
      */}
      {node.children.map((childId) => (
        <SceneNode key={childId} id={childId} depth={depth + 1} />
      ))}
    </group>
  );

  if (!isSelected || node.type === "environment") {
    return content;
  }

  return (
    <PivotControls
      active
      depthTest={false}
      lineWidth={3}
      scale={1.35}
      disableRotations={false}
      disableScaling
      onDrag={(localMatrix) => {
        dragMatrix.copy(localMatrix);
        dragMatrix.decompose(dragPosition, dragQuaternion, dragScale);
        updateNodePosition(id, [
          Number(dragPosition.x.toFixed(3)),
          Number(dragPosition.y.toFixed(3)),
          Number(dragPosition.z.toFixed(3))
        ]);
      }}
    >
      {content}
    </PivotControls>
  );
}

function RoomCanvas() {
  const rootId = useRoomStore((state) => state.rootId);
  const selectNode = useRoomStore((state) => state.selectNode);

  return (
    <Canvas camera={{ position: [5.4, 4.1, 5.7], fov: 48 }} shadows onPointerMissed={() => selectNode(rootId)}>
      <color attach="background" args={["#071018"]} />
      <fog attach="fog" args={["#071018", 7, 15]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 7, 3]} intensity={1.4} castShadow />
      <pointLight position={[0, 1.4, -2.15]} color="#fb923c" intensity={8} distance={4.5} />
      <Grid infiniteGrid sectionColor="#334155" cellColor="#182233" fadeDistance={18} fadeStrength={2} />

      {/*
        The entire visible room starts from one root ID. From there, <SceneNode>
        walks the normalized dictionary recursively and rebuilds the live hierarchy.
      */}
      <SceneNode id={rootId} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}

function Toolbar() {
  const viewMode = useRoomStore((state) => state.viewMode);
  const setViewMode = useRoomStore((state) => state.setViewMode);
  const resetScene = useRoomStore((state) => state.resetScene);
  const modes = [
    ["mixed", "Mixed Mode"],
    ["3d", "3D Only"],
    ["text", "Text Only"]
  ];

  return (
    <div className="toolbar">
      <div className="brand">
        <span className="brand-mark">B</span>
        <span>
          <strong>Brawlygon</strong>
          <small>spatial wiki VTT</small>
        </span>
      </div>
      <div className="mode-switcher" aria-label="View mode">
        {modes.map(([mode, label]) => (
          <button key={mode} className={viewMode === mode ? "active" : ""} onClick={() => setViewMode(mode)}>
            {label}
          </button>
        ))}
      </div>
      <button className="ghost-button" onClick={resetScene}>
        Reset Scene
      </button>
    </div>
  );
}

function HierarchyTree() {
  const rootId = useRoomStore((state) => state.rootId);

  return (
    <aside className="panel hierarchy">
      <div className="panel-heading">
        <span>Scene Graph</span>
        <small>normalized nodes</small>
      </div>
      <TreeNode id={rootId} depth={0} />
    </aside>
  );
}

function TreeNode({ id, depth }) {
  const node = useRoomStore((state) => state.nodes[id]);
  const selectedNodeId = useRoomStore((state) => state.selectedNodeId);
  const expandedIds = useRoomStore((state) => state.expandedIds);
  const toggleExpanded = useRoomStore((state) => state.toggleExpanded);
  const selectNode = useRoomStore((state) => state.selectNode);
  const isExpanded = expandedIds.has(id);
  const hasChildren = node.children.length > 0;

  return (
    <div className="tree-row-wrap">
      <button
        className={`tree-row ${selectedNodeId === id ? "selected" : ""}`}
        style={{ "--depth": depth }}
        onClick={() => selectNode(id)}
      >
        <span
          className="disclosure"
          onClick={(event) => {
            event.stopPropagation();
            if (hasChildren) toggleExpanded(id);
          }}
        >
          {hasChildren ? (isExpanded ? "−" : "+") : "•"}
        </span>
        <span className={`type-dot ${node.type}`} />
        <span>{node.name}</span>
      </button>
      {isExpanded &&
        node.children.map((childId) => <TreeNode key={childId} id={childId} depth={depth + 1} />)}
    </div>
  );
}

function InspectorPanel() {
  const selectedNodeId = useRoomStore((state) => state.selectedNodeId);
  const node = useRoomStore((state) => state.nodes[selectedNodeId]);
  const updateNodeDescription = useRoomStore((state) => state.updateNodeDescription);

  if (!node) return null;

  return (
    <aside className="panel inspector">
      <div className="panel-heading">
        <span>Inspector</span>
        <small>{node.id}</small>
      </div>
      <div className="inspector-title">
        <span className={`type-pill ${node.type}`}>{node.type}</span>
        <h2>{node.name}</h2>
      </div>
      <label>
        Description
        <textarea value={node.description} onChange={(event) => updateNodeDescription(node.id, event.target.value)} />
      </label>
      <div className="meta-grid">
        <span>Position</span>
        <code>[{node.position.join(", ")}]</code>
        <span>Rotation</span>
        <code>[{node.rotation.map((value) => Number(value).toFixed(2)).join(", ")}]</code>
        <span>Children</span>
        <code>{node.children.length}</code>
      </div>
      <label>
        glTF extras
        <pre>{JSON.stringify(node.extras, null, 2)}</pre>
      </label>
    </aside>
  );
}

function WikiPage() {
  const rootId = useRoomStore((state) => state.rootId);

  return (
    <main className="wiki-page">
      <section className="wiki-hero">
        <p>Text Only Mode</p>
        <h1>The room as a spatial wiki</h1>
        <span>
          Same normalized scene graph, rendered as readable knowledge instead of 3D objects. Nothing here assumes a
          game system.
        </span>
      </section>
      <WikiNode id={rootId} depth={0} />
    </main>
  );
}

function WikiNode({ id, depth }) {
  const node = useRoomStore((state) => state.nodes[id]);
  const selectNode = useRoomStore((state) => state.selectNode);
  const setViewMode = useRoomStore((state) => state.setViewMode);

  return (
    <article className="wiki-card" style={{ "--depth": depth }}>
      <header>
        <span className={`type-pill ${node.type}`}>{node.type}</span>
        <button
          onClick={() => {
            selectNode(id);
            setViewMode("mixed");
          }}
        >
          Select in 3D
        </button>
      </header>
      <h2>{node.name}</h2>
      <p>{node.description}</p>
      <pre>{JSON.stringify(node.extras, null, 2)}</pre>

      {/*
        Recursive wiki rendering:
        The text view follows the exact same child ID links as the Canvas. This keeps
        the spatial hierarchy and document hierarchy synchronized without duplicating
        nested state.
      */}
      {node.children.map((childId) => (
        <WikiNode key={childId} id={childId} depth={depth + 1} />
      ))}
    </article>
  );
}

function App() {
  const viewMode = useRoomStore((state) => state.viewMode);
  const showCanvas = viewMode !== "text";
  const showPanels = viewMode === "mixed";

  return (
    <div className={`app-shell mode-${viewMode}`}>
      {showCanvas && (
        <div className="canvas-layer">
          <RoomCanvas />
        </div>
      )}
      <Toolbar />
      {showPanels && (
        <div className="overlay-grid">
          <HierarchyTree />
          <InspectorPanel />
        </div>
      )}
      {viewMode === "text" && <WikiPage />}
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
