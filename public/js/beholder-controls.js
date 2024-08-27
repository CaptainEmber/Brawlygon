// beholder-controls.js
AFRAME.registerComponent("beholder-controls", {
  schema: {
    acceleration: { default: 65 },
    adAxis: { default: "x", oneOf: ["x", "y", "z"] },
    adEnabled: { default: true },
    adInverted: { default: false },
    enabled: { default: true },
    wsAxis: { default: "z", oneOf: ["x", "y", "z"] },
    wsEnabled: { default: true },
    wsInverted: { default: false },
    udAxis: { default: "y", oneOf: ["x", "y", "z"] },
    udEnabled: { default: true },
    udInverted: { default: false },
  },
  after: ["look-controls"],

  init: function () {
    // To keep track of the pressed keys.
    this.keys = {};
    this.easing = 1.2;
    this.velocity = new THREE.Vector3();

    // Bind methods and add event listeners.
    this.onBlur = this.onBlur.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.attachVisibilityEventListeners();
  },

  tick: function (time, delta) {
    var data = this.data;
    var el = this.el;
    var velocity = this.velocity;

    //Check to see if anything is pressed or if there's any velocity still going
    if (
      this.isEmptyObject(this.keys) &&
      !velocity[data.adAxis] &&
      !velocity[data.wsAxis] &&
      !velocity[data.udAxis]
    ) {
      return;
    }
    // Update velocity.
    delta = delta / 2000;
    this.updateVelocity(delta);

    if (!velocity[data.adAxis] && !velocity[data.wsAxis]) {
      return;
    }

    // Get movement vector and translate position.
    el.object3D.position.add(this.getMovementVector(delta));
  },

  update: function (oldData) {
    // Reset velocity if axis have changed.
    if (oldData.adAxis !== this.data.adAxis) {
      this.velocity[oldData.adAxis] = 0;
    }
    if (oldData.wsAxis !== this.data.wsAxis) {
      this.velocity[oldData.wsAxis] = 0;
    }
    if (oldData.udAxis !== this.data.udAxis) {
      this.velocity[oldData.udAxis] = 0;
    }
  },

  remove: function () {
    this.removeKeyEventListeners();
    this.removeVisibilityEventListeners();
  },

  play: function () {
    this.attachKeyEventListeners();
  },

  pause: function () {
    this.keys = {};
    this.removeKeyEventListeners();
  },

  updateVelocity: function (delta) {
    var acceleration;
    var adAxis;
    var adSign;
    var data = this.data;
    var keys = this.keys;
    var velocity = this.velocity;
    var wsAxis;
    var wsSign;
    var udAxis;
    var udSign;

    adAxis = data.adAxis;
    wsAxis = data.wsAxis;
    udAxis = data.udAxis;

    // If FPS too low, reset velocity.
    if (delta > MAX_DELTA) {
      velocity[adAxis] = 0;
      velocity[wsAxis] = 0;
      velocity[udAxis] = 0;
      return;
    }

    // https://gamedev.stackexchange.com/questions/151383/frame-rate-independant-movement-with-acceleration
    var scaledEasing = Math.pow(1 / this.easing, delta * 60);
    // Velocity Easing.
    if (velocity[adAxis] !== 0) {
      velocity[adAxis] = velocity[adAxis] * scaledEasing;
    }
    if (velocity[wsAxis] !== 0) {
      velocity[wsAxis] = velocity[wsAxis] * scaledEasing;
    }
    if (velocity[udAxis] !== 0) {
      velocity[udAxis] = velocity[udAxis] * scaledEasing;
    }

    // Clamp velocity easing.
    if (Math.abs(velocity[adAxis]) < CLAMP_VELOCITY) {
      velocity[adAxis] = 0;
    }
    if (Math.abs(velocity[wsAxis]) < CLAMP_VELOCITY) {
      velocity[wsAxis] = 0;
    }
    if (Math.abs(velocity[udAxis]) < CLAMP_VELOCITY) {
      velocity[udAxis] = 0;
    }

    if (!data.enabled) {
      return;
    }

    // Update velocity using keys pressed.
    acceleration = data.acceleration;
    if (data.adEnabled) {
      adSign = data.adInverted ? -1 : 1;
      if (keys.KeyA || keys.ArrowLeft) {
        velocity[adAxis] -= adSign * acceleration * delta;
      }
      if (keys.KeyD || keys.ArrowRight) {
        velocity[adAxis] += adSign * acceleration * delta;
      }
    }
    if (data.wsEnabled) {
      wsSign = data.wsInverted ? -1 : 1;
      if (keys.KeyW || keys.ArrowUp) {
        velocity[wsAxis] -= wsSign * acceleration * delta;
      }
      if (keys.KeyS || keys.ArrowDown) {
        velocity[wsAxis] += wsSign * acceleration * delta;
      }
    }
    if (data.udEnabled) {
      udSign = data.udInverted ? -1 : 1;
      if (keys.Space || keys.Equal) {
        velocity[udAxis] += udSign * acceleration * delta;
      } // Move up
      if (keys.ControlLeft || keys.Minus) {
        velocity[udAxis] -= udSign * acceleration * delta;
      } // Move down
    }
  },

  getMovementVector: (function () {
    var directionVector = new THREE.Vector3(0, 0, 0);
    var rotationEuler = new THREE.Euler(0, 0, 0, "YXZ");

    return function (delta) {
      var rotation = this.el.getAttribute("rotation");
      var velocity = this.velocity;
      var xRotation;

      directionVector.copy(velocity);
      directionVector.multiplyScalar(delta);

      // Absolute.
      if (!rotation) {
        return directionVector;
      }

      xRotation = this.data.fly ? rotation.x : 0;

      // Transform direction relative to heading.
      rotationEuler.set(
        THREE.MathUtils.degToRad(xRotation),
        THREE.MathUtils.degToRad(rotation.y),
        0
      );
      directionVector.applyEuler(rotationEuler);
      return directionVector;
    };
  })(),

  attachVisibilityEventListeners: function () {
    window.oncontextmenu = this.onContextMenu;
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("focus", this.onFocus);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  },

  removeVisibilityEventListeners: function () {
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("focus", this.onFocus);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  },

  attachKeyEventListeners: function () {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  },

  removeKeyEventListeners: function () {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  },

  onContextMenu: function () {
    var keys = Object.keys(this.keys);
    for (var i = 0; i < keys.length; i++) {
      delete this.keys[keys[i]];
    }
  },

  onBlur: function () {
    this.pause();
  },

  onFocus: function () {
    this.play();
  },

  onVisibilityChange: function () {
    if (document.hidden) {
      this.onBlur();
    } else {
      this.onFocus();
    }
  },

  onKeyDown: function (event) {
    var code;
    if (!this.shouldCaptureKeyEvent(event)) {
      return;
    }
    code = event.code || KEYCODE_TO_CODE[event.keyCode];
    if (KEYS.indexOf(code) !== -1) {
      this.keys[code] = true;
    }
  },

  onKeyUp: function (event) {
    var code;
    code = event.code || KEYCODE_TO_CODE[event.keyCode];
    delete this.keys[code];
  },
 
  shouldCaptureKeyEvent: function (event) {
    if (event.metaKey) {
      return false;
    }
    return document.activeElement === document.body;
  },
  
  handleButtonPress: function(buttonId, isPressed) {
  const key = buttonId; // Use buttonId directly as the key code

  if (isPressed) {
    this.keys[key] = true;
  } else {
    delete this.keys[key];
  }
},

  
  isEmptyObject: function (keys) {
    for (var key in keys) {
      return false;
    }
    return true;
  },
});

// Keycode to Code Map (replace require)
const KEYCODE_TO_CODE = {
  38: "ArrowUp",
  37: "ArrowLeft",
  40: "ArrowDown",
  39: "ArrowRight",
  87: "KeyW",
  65: "KeyA",
  83: "KeyS",
  68: "KeyD",
  // Add more keycodes as needed
};

// Constant Definitions (replace require)
const CLAMP_VELOCITY = 0.00001;
const MAX_DELTA = 0.2;
const KEYS = [
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowLeft",
  "ArrowRight",
  "ArrowDown",
  "Space",
  "ControlLeft",
  "Equal",
  "Minus",
];