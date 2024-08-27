// Dungeon Spawner Component (Fetch JSON and create entities)
// This takes a JSON export from watabou's Procgen arcana, and spawns bits to represent all the bits!
// https://watabou.github.io/
    AFRAME.registerComponent("dungeon-generator", {
      schema: {
        dungeonDataUrl: { type: "string", default: "./dungeon.json" },
      },

      init: function () {
        const dataUrl = this.data.dungeonDataUrl;
        const sceneEl = this.el.sceneEl; // Reference to the scene element
        let floorCounter = 1;
        let doorCounter = 1;
        let columnCounter = 1;

        // Fetch the JSON file
        fetch(dataUrl)
          .then((response) => response.json())
          .then((dungeonData) => {
            console.log("Dungeon data:", dungeonData);
            const gridSize = 1;
            const floorModelUrls = ["#floor01", "#floor02"];
            const wallModelUrls = [
              "#wall01",
            ];
            const floorTiles = new Set();
            const wallTiles = new Set();

            // Helper function to check if a position is within a rect
            function isInsideRect(x, z, rect) {
              return (
                x >= rect.x &&
                x < rect.x + rect.w &&
                z >= rect.y &&
                z < rect.y + rect.h
              );
            }

// Function to create floor tiles within a rect and add them to floorTiles Set
function createFloorTiles(rect) {
  const width = rect.w;
  const depth = rect.h;

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < depth; j++) {
      const x = rect.x + i;
      const z = rect.y + j;
      floorTiles.add(`${x},${z}`);

      const entity = document.createElement("a-entity");
      const modelUrl = floorModelUrls[Math.floor(Math.random() * floorModelUrls.length)];
      entity.setAttribute("gltf-model", modelUrl);
      entity.setAttribute("position", `${x + 0.5} 0 ${z + 0.5}`);
      sceneEl.appendChild(entity);

      // Check adjacent tiles and spawn walls if needed ONLY FOR NON-ROTUNDA ROOMS
      if (!rect.rotunda) {
        for (const [dx, dz] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const adjX = x + dx;
          const adjZ = z + dz;
          const adjKey = `${adjX},${adjZ}`;
          const isAdjacentInAnyRect = dungeonData.rects.some((otherRect) => isInsideRect(adjX, adjZ, otherRect));

          if (!floorTiles.has(adjKey) && !wallTiles.has(adjKey) && !isAdjacentInAnyRect) {
            wallTiles.add(adjKey);
            const entity = document.createElement("a-entity");
            const modelUrl = wallModelUrls[Math.floor(Math.random() * wallModelUrls.length)];
            entity.setAttribute("gltf-model", modelUrl);
            entity.setAttribute("position", `${adjX + 0.5} 0 ${adjZ + 0.5}`);
            sceneEl.appendChild(entity);
          }
        }
      }
    }
  }
}

            // Function to create walls and rooms
            function createRect(rect) {
              const isRotunda = rect.rotunda || false;
              const width = rect.w;
              const depth = rect.h;

              if (isRotunda) {
                // Handle rotunda
                const entity = document.createElement("a-entity");
                entity.setAttribute("gltf-model", "#rotunda01");
                const x = rect.x * gridSize + width / 2;
                const z = rect.y * gridSize + depth / 2;
                entity.setAttribute("position", `${x} 0 ${z}`);
                entity.setAttribute("scale", `${width} 1 ${depth}`); // Scale the rotunda
                sceneEl.appendChild(entity);
              } 

              createFloorTiles(rect); // Create floor tiles inside the room
            }
            // Function to create doors
            function createDoor(door) {
              const halfGrid = gridSize / 2;
              const doorUrl = `#door0${Math.floor(Math.random() * 2) + 1}`; // Choose between 2 doors

              // Determine rotation based on dir values
              let rotation = 0;
              if (door.dir.y === 1) {
                rotation = 270;
              } else if (door.dir.y === -1) {
                rotation = 90;
              } else if (door.dir.x === 1) {
                rotation = 180;
              } else if (door.dir.x === -1) {
                rotation = 0;
              }

              // Calculate offset based on rotation
              let offsetX = 0.5 * gridSize;
              let offsetZ = 0.5 * gridSize;
              if (rotation === 90) {
                offsetZ = -halfGrid;
              } else if (rotation === 270) {
                offsetZ = halfGrid;
              }

              // Calculate position with offset
              const position = {
                x: door.x * gridSize + offsetX,
                y: 0, // Set door height to 0
                z: door.y * gridSize + offsetZ,
              };

              const entity = document.createElement("a-entity");
              entity.setAttribute("position", position);
              entity.setAttribute("rotation", `0 ${rotation} 0`);
              entity.setAttribute("gltf-model", doorUrl); // Use selected door model
              sceneEl.appendChild(entity);
            }

            // Function to create columns
            function createColumn(column) {
              const entity = document.createElement("a-entity");
              entity.setAttribute("gltf-model", "#column01");
              const position = {
                x: column.x * gridSize,
                y: 0,
                z: column.y * gridSize,
              }; // Y is always 0 for floor
              entity.setAttribute("position", position);
              sceneEl.appendChild(entity);
            }

            // Function to create water plane
            function createWater() {
              // ... (your createWater function remains the same) ...
            }


            // Create entities based on the JSON data (INSIDE THE `then` block)
            dungeonData.rects.forEach(createRect.bind(this));
            dungeonData.doors.forEach(createDoor.bind(this));
            dungeonData.columns.forEach(createColumn.bind(this));

            // Create the water plane
            const waterEntity = createWater();
            this.el.appendChild(waterEntity); // Add to the scene
          })
          .catch((error) =>
            console.error("Error loading dungeon data:", error)
          );
      },
    });
