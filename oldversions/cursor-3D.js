AFRAME.registerComponent('cursor-3d', {
  schema: {
    default: '',
  },

  init: function () {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.cursorPosition = new THREE.Vector3();

    // Create a small sphere to represent the cursor
    const cursorGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const cursorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
    this.cursorMesh = new THREE.Mesh(cursorGeometry, cursorMaterial);
    this.el.object3D.add(this.cursorMesh);

    // Set a property to identify the cursor sphere
    this.cursorMesh.userData.isCursor = true;

    // Add event listeners for mouse movement and clicks
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('click', this.onMouseClick.bind(this));
  },

  onMouseMove: function (event) {
    // Update the mouse position
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  },

  onMouseClick: function (event) {
    // Handle click events if needed
    // For example, select a token or interact with an object
  },

  tick: function () {
    const camera = this.el.sceneEl.camera;

    // Update the raycaster with the current mouse position
    this.raycaster.setFromCamera(this.mouse, camera);

    // Find intersections with the scene, filtering out the cursor sphere
    const intersects = this.raycaster.intersectObjects(this.el.sceneEl.object3D.children, true).filter(intersect => !intersect.object.userData.isCursor);

    if (intersects.length > 0) {
      // Update the cursor position to the intersection point
      this.cursorPosition.copy(intersects[0].point);
      this.cursorMesh.position.copy(this.cursorPosition);

      // Dispatch intersection event
      this.el.sceneEl.dispatchEvent(new CustomEvent('cursor-intersect', {
        detail: { intersectedEl: intersects[0].object.el }
      }));
    }
  },
});