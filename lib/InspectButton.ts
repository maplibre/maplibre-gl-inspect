type InspectButtonOptions = {
  show: boolean;
  onToggle: () => void;
};

class InspectButton {
  _btn: HTMLButtonElement;
  elem: HTMLDivElement;

  constructor(options: InspectButtonOptions) {
    options = Object.assign({
      show: true,
      onToggle() {}
    }, options);

    this._btn = this.createButton();
    this._btn.onclick = options.onToggle;
    this.elem = this.createContainer(this._btn, options.show);
  }

  private createButton() {
    const btn = document.createElement('button');
    btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-inspect';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Inspect');
    return btn;
  }

  private createContainer(child: HTMLElement, show: boolean): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    container.appendChild(child);
    if (!show) {
      container.style.display = 'none';
    }
    return container;
  }

  public setInspectIcon() {
    this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-inspect';
  }

  public setMapIcon() {
    this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-map';
  }
}
export default InspectButton;
