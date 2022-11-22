function container(child, show) {
  const container = document.createElement('div');
  container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
  container.appendChild(child);
  if (!show) {
    container.style.display = 'none';
  }
  return container;
}

function button() {
  const btn = document.createElement('button');
  btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-inspect';
  btn.type = 'button';
  btn['aria-label'] = 'Inspect';
  return btn;
}

function InspectButton(options) {
  options = Object.assign({
    show: true,
    onToggle() {}
  }, options);

  this._btn = button();
  this._btn.onclick = options.onToggle;
  this.elem = container(this._btn, options.show);
}

InspectButton.prototype.setInspectIcon = function () {
  this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-inspect';
};

InspectButton.prototype.setMapIcon = function () {
  this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-map';
};

module.exports = InspectButton;
