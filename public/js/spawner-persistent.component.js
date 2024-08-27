/* global AFRAME, NAF */
AFRAME.registerComponent('spawner-persistent', {
  schema: {
    template: { default: '' },
    keyCode: { default: 84 }
  },

  init: function() {
    this.onSpawnButtonClick = this.onSpawnButtonClick.bind(this);
    const spawnButton = document.createElement('button');
    spawnButton.textContent = 'Spawn Token';
    spawnButton.addEventListener('click', this.onSpawnButtonClick);

    const tokenPanel = document.getElementById('tokenPanel');
    tokenPanel.appendChild(spawnButton);
  },

  onSpawnButtonClick: function() {
    const tokenSelector = document.getElementById('token-selector');
    const selectedModel = tokenSelector.value;

    if (selectedModel) {
      const el = document.createElement('a-entity');
      this.el.sceneEl.appendChild(el);
      el.setAttribute('position', this.el.getAttribute('position'));
      el.setAttribute('networked', {persistent: true, template: this.data.template});
      el.setAttribute('gltf-model', selectedModel);

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(new CustomEvent('persistentEntityCreated', {detail: {el: el}}));
      });
    } else {
      alert('Please select a token model.');
    }
  }
});

