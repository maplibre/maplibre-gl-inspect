import isEqual from 'lodash.isequal';
import stylegen from './stylegen';
import InspectButton from './InspectButton';
import renderPopup from './renderPopup';
import colors from './colors';
import type { StyleSpecification } from 'maplibre-gl';

function isInspectStyle(style: StyleSpecification) {
  return style.metadata && (style.metadata as any)['maplibregl-inspect:inspect'];
}

function markInspectStyle(style: StyleSpecification) {
  return Object.assign(style, {
    metadata: Object.assign({}, style.metadata, {
      'maplibregl-inspect:inspect': true
    })
  });
}

class MaplibreInspect {
  options: any;
  constructor(options: any) {
    if (!(this instanceof MaplibreInspect)) {
      throw new Error('MaplibreInspect needs to be called with the new keyword');
    }

    let popup = null;
    if (window.maplibregl) {
      popup = new window.maplibregl.Popup({
        closeButton: false,
        closeOnClick: false
      });
    } else if (!options.popup) {
      console.error('Maplibre GL JS can not be found. Make sure to include it or pass an initialized MaplibreGL Popup to MaplibreInspect if you are using moduleis.');
    }

    this.options = Object.assign({
      showInspectMap: false,
      showInspectButton: true,
      showInspectMapPopup: true,
      showMapPopup: false,
      showMapPopupOnHover: true,
      showInspectMapPopupOnHover: true,
      blockHoverPopupOnClick: false,
      backgroundColor: '#fff',
      assignLayerColor: colors.brightColor,
      buildInspectStyle: stylegen.generateInspectStyle,
      renderPopup,
      popup,
      selectThreshold: 5,
      useInspectStyle: true,
      queryParameters: {},
      sources: {},
      toggleCallback() {}
    }, options);

    this.sources = this.options.sources;
    this.assignLayerColor = this.options.assignLayerColor;
    this.toggleInspector = this.toggleInspector.bind(this);
    this._popup = this.options.popup;
    this._popupBlocked = false;
    this._showInspectMap = this.options.showInspectMap;
    this._onSourceChange = this._onSourceChange.bind(this);
    this._onMousemove = this._onMousemove.bind(this);
    this._onRightClick = this._onRightClick.bind(this);
    this._onStyleChange = this._onStyleChange.bind(this);

    this._originalStyle = null;
    this._toggle = new InspectButton({
      show: this.options.showInspectButton,
      onToggle: this.toggleInspector.bind(this)
    });
  }

MaplibreInspect.prototype.toggleInspector = function () {
  this._showInspectMap = !this._showInspectMap;
  this.options.toggleCallback(this._showInspectMap);
  this.render();
};

MaplibreInspect.prototype._inspectStyle = function () {
  const coloredLayers = stylegen.generateColoredLayers(this.sources, this.assignLayerColor);
  return this.options.buildInspectStyle(this._map.getStyle(), coloredLayers, {
    backgroundColor: this.options.backgroundColor
  });
};

MaplibreInspect.prototype.render = function () {
  if (this._showInspectMap) {
    if (this.options.useInspectStyle) {
      this._map.setStyle(markInspectStyle(this._inspectStyle()));
    }
    this._toggle.setMapIcon();
  } else if (this._originalStyle) {
    if (this._popup) this._popup.remove();
    if (this.options.useInspectStyle) {
      this._map.setStyle(this._originalStyle);
    }
    this._toggle.setInspectIcon();
  }
};

MaplibreInspect.prototype._onSourceChange = function (e) {
  const sources = this.sources;
  const map = this._map;
  const mapStyle = map.getStyle();
  const mapStyleSourcesNames = Object.keys(mapStyle.sources);
  const previousSources = Object.assign({}, sources);

  //NOTE: This heavily depends on the internal API of Maplibre GL
  //so this breaks between Maplibre GL JS releases
  if (e.sourceDataType !==  'visibility' && e.isSourceLoaded) {
    Object.keys(map.style.sourceCaches).forEach((sourceId) => {
      const sourceCache = map.style.sourceCaches[sourceId] || {_source: {}};
      const layerIds = sourceCache._source.vectorLayerIds;
      if (layerIds) {
        sources[sourceId] = layerIds;
      } else if (sourceCache._source.type === 'geojson') {
        sources[sourceId] = [];
      }
    });

    Object.keys(sources).forEach((sourceId) => {
      if (mapStyleSourcesNames.indexOf(sourceId) === -1) {
        delete sources[sourceId];
      }
    });

    if (!isEqual(previousSources, sources) && Object.keys(sources).length > 0) {
      this.render();
    }
  }
};

MaplibreInspect.prototype._onStyleChange = function () {
  const style = this._map.getStyle();
  if (!isInspectStyle(style)) {
    this._originalStyle = style;
  }
};

MaplibreInspect.prototype._onRightClick = function () {
  if (!this.options.showMapPopupOnHover && !this.options.showInspectMapPopupOnHover && !this.options.blockHoverPopupOnClick) {
    if (this._popup) this._popup.remove();
  }
};

MaplibreInspect.prototype._onMousemove = function (e) {
  if (this._showInspectMap) {
    if (!this.options.showInspectMapPopup) return;
    if (e.type === 'mousemove' && !this.options.showInspectMapPopupOnHover) return;
    if (e.type === 'click' && this.options.showInspectMapPopupOnHover && this.options.blockHoverPopupOnClick) {
      this._popupBlocked = !this._popupBlocked;
    }
  } else {
    if (!this.options.showMapPopup) return;
    if (e.type === 'mousemove' && !this.options.showMapPopupOnHover) return;
    if (e.type === 'click' && this.options.showMapPopupOnHover && this.options.blockHoverPopupOnClick) {
      this._popupBlocked = !this._popupBlocked;
    }
  }

  if (!this._popupBlocked && this._popup) {
    let queryBox;
    if (this.options.selectThreshold === 0) {
      queryBox = e.point;
    } else {
      // set a bbox around the pointer
      queryBox = [
        [
          e.point.x - this.options.selectThreshold,
          e.point.y + this.options.selectThreshold
        ], // bottom left (SW)
        [
          e.point.x + this.options.selectThreshold,
          e.point.y - this.options.selectThreshold
        ] // top right (NE)
      ];
    }

    const features = this._map.queryRenderedFeatures(queryBox, this.options.queryParameters) || [];
    this._map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    if (!features.length) {
      this._popup.remove();
    } else {
      this._popup.setLngLat(e.lngLat);

      const renderedPopup = this.options.renderPopup(features);

      if (typeof renderedPopup === 'string') {
        this._popup.setHTML(renderedPopup);
      } else {
        this._popup.setDOMContent(renderedPopup);
      }

      this._popup.addTo(this._map);
    }
  }
};

MaplibreInspect.prototype.onAdd = function (map) {
  this._map = map;

  // if sources have already been passed as options
  // we do not need to figure out the sources ourselves
  if (Object.keys(this.sources).length === 0) {
    map.on('tiledata', this._onSourceChange);
    map.on('sourcedata', this._onSourceChange);
  }

  map.on('styledata', this._onStyleChange);
  map.on('load', this._onStyleChange);
  map.on('mousemove', this._onMousemove);
  map.on('click', this._onMousemove);
  map.on('contextmenu', this._onRightClick);
  return this._toggle.elem;
};

MaplibreInspect.prototype.onRemove = function () {
  this._map.off('styledata', this._onStyleChange);
  this._map.off('load', this._onStyleChange);
  this._map.off('tiledata', this._onSourceChange);
  this._map.off('sourcedata', this._onSourceChange);
  this._map.off('mousemove', this._onMousemove);
  this._map.off('click', this._onMousemove);
  this._map.off('contextmenu', this._onRightClick);

  const elem = this._toggle.elem;
  elem.parentNode.removeChild(elem);
  this._map = undefined;
};
}
export default MaplibreInspect;
