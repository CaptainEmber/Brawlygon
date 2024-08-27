AFRAME.registerComponent("token-interaction", {
  schema: {
    held: { type: "boolean", default: false },
  },

  init: function () {
    this.playerEntity = document.getElementById("player");
    this.el.addEventListener("click", this.handleClick.bind(this));
    this.possessedToken = null;
  },

  handleClick: function () {
    if (!this.data.held) {
      this.possessToken();
    }
  },

  possessToken: function () {
    this.possessedToken = this.el;
    this.el.setAttribute("held", true);
    this.el.setAttribute("visible", false);
    this.playerEntity.setAttribute("player-info", {
      isHolding: true,
      heldTokenId: this.el.id,
    });
  },

  unpossess: function () {
    if (this.possessedToken) {
      this.possessedToken.setAttribute("held", false);
      this.possessedToken.setAttribute("visible", true);
      this.playerEntity.setAttribute("player-info", {
        isHolding: false,
        heldTokenId: "",
      });
      this.possessedToken = null;
    }
  },

  tick: function () {
    if (this.possessedToken) {
      const playerPosition = this.playerEntity.getAttribute("position");
      this.possessedToken.setAttribute("position", {
        x: playerPosition.x,
        y: playerPosition.y - 1,
        z: playerPosition.z,
      });
    }
  },
});