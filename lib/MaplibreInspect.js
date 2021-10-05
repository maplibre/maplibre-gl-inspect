var stylegen = require('./stylegen');
var InspectButton = require('./InspectButton');
var isEqual = require('lodash.isequal');
var renderPopup = require('./renderPopup');
var colors = require('./colors');

function isInspectStyle(style) {
  return style.metadata && style.metadata['maplibregl-inspect:inspect'];
}

function markInspectStyle(style) {
  return Object.assign(style, {
    metadata: Object.assign({}, style.metadata, {
      'maplibregl-inspect:inspect': true
    })
  });
}

function MaplibreInspect(options) {
  if (!(this instanceof MaplibreInspect)) {
    throw new Error('MaplibreInspect needs to be called with the new keyword');
  }

  var popup = null;
  if (window.maplibregl) {
    popup = new window.maplibregl.Popup({
      closeButton: false,
      closeOnClick: false
    });
  } else if (!options.popup) {
    console.error('Maplibre GL JS can not be found. Make sure to include it or pass an initialized maplibregl Popup to MaplibreInspect if you are using moduleis.');
  }

  this.options = Object.assign({
    showInspectMap: false,
    showInspectButton: true,
    showInspectMapPopup: true,
    showMapPopup: false,
    showMapPopupOnHover: false,
    showInspectMapPopupOnHover: false,
    blockHoverPopupOnClick: false,
    keepInspectOnTileChange: false,
    backgroundColor: '#fff',
    assignLayerColor: colors.brightColor,
    buildInspectStyle: stylegen.generateInspectStyle,
    renderPopup: renderPopup,
    popup: popup,
    selectThreshold: 5,
    useInspectStyle: true,
    queryParameters: {},
    sources: {}
  }, options);

  this.sources = this.options.sources;
  this.assignLayerColor = this.options.assignLayerColor;
  this.toggleInspector = this.toggleInspector.bind(this);
  this._popup = this.options.popup;
  this._popupBlocked = false;
  this._showInspectMap = this.options.showInspectMap;
  this._keepInspectOnStyleChange = this.options.keepInspectOnTileChange;
  this._onSourceChange = this._onSourceChange.bind(this);
  this._onMousemove = this._onMousemove.bind(this);
  this._onStyleChange = this._onStyleChange.bind(this);

  this._originalStyle = null;
  this._toggle = new InspectButton({
    show: this.options.showInspectButton,
    onToggle: this.toggleInspector.bind(this)
  });
}

MaplibreInspect.prototype.toggleInspector = function () {
  this._showInspectMap = !this._showInspectMap;
  this.render();
};

MaplibreInspect.prototype._inspectStyle = function () {
  var coloredLayers = stylegen.generateColoredLayers(this.sources, this.assignLayerColor);
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

MaplibreInspect.prototype._onSourceChange = function () {
  var sources = this.sources;
  var map = this._map;
  var previousSources = Object.assign({}, sources);

  //NOTE: This heavily depends on the internal API of Maplibre GL
  //so this breaks between Maplibre GL JS releases
  Object.keys(map.style.sourceCaches).forEach(function (sourceId) {
    var layerIds = map.style.sourceCaches[sourceId]._source.vectorLayerIds;
    if (layerIds) {
      sources[sourceId] = layerIds;
    }
  });

  if (!isEqual(previousSources, sources)) {
    this.render();
  }
};

MaplibreInspect.prototype._onStyleChange = function () {
  var style = this._map.getStyle();
  if (!isInspectStyle(style)) {
    this._originalStyle = style;
    if (this._showInspectMap && this._keepInspectOnStyleChange) {
      this.render();
    } else if (this._showInspectMap && !this._keepInspectOnStyleChange) {
      this._showInspectMap = !this._showInspectMap;
      this._toggle.setInspectIcon();
	  if (this._popup) this._popup.remove();
    }
  }
};

MaplibreInspect.prototype._onMousemove = function (e) {
  if (!this.options.showInspectMapPopup && this._showInspectMap) return;
  if (!this.options.showMapPopup && !this._showInspectMap) return;

  var features = this._map.queryRenderedFeatures(e.point);
  this._map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';

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
    if (!features.length) {
      this._popup.remove();
    } else {
      this._popup.setLngLat(e.lngLat);

      var renderedPopup = this.options.renderPopup(features);

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
  return this._toggle.elem;
};

MaplibreInspect.prototype.onRemove = function () {
  this._map.off('styledata', this._onStyleChange);
  this._map.off('load', this._onStyleChange);
  this._map.off('tiledata', this._onSourceChange);
  this._map.off('sourcedata', this._onSourceChange);
  this._map.off('mousemove', this._onMousemove);

  var elem = this._toggle.elem;
  elem.parentNode.removeChild(elem);
  this._map = undefined;
};

module.exports = MaplibreInspect;
