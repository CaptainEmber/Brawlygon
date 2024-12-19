AFRAME.registerComponent('color-changer-networked', {
  init: function () {
    console.log('Color changer initialized');
    if (this.el.components.networked) {
      console.log('Networked component found');
    } else {
      console.error('Networked component not found');
    }
    this.el.addEventListener('click', this.changeColor.bind(this));
  },

  changeColor: function () {
    console.log('Color changer clicked');
    const el = this.el;
    if (!el.components.networked) {
      console.error('Entity does not have the [networked] component');
      return;
    }

    const currentColor = el.getAttribute('material').color;
    const newColor = window.ntExample.randomColor();

    el.setAttribute('material', 'color', newColor);

    // Take ownership if needed
    if (el.components.networked.isMine()) {
      el.components.networked.takeOwnership();
    }
  }
});