import isEqual from 'lodash.isequal';
import stylegen from './stylegen';
import InspectButton from './InspectButton';
import renderPopup, { GeoJSONFeatureWithSourceLayer } from './renderPopup';
import colors from './colors';
import type { IControl, LayerSpecification, Map, MapMouseEvent, MapSourceDataEvent, PointLike, Popup, QueryRenderedFeaturesOptions, StyleSpecification } from 'maplibre-gl';

type InspectStyleSpecification = StyleSpecification & { metadata: { 'maplibregl-inspect:inspect': boolean } };

function isInspectStyle(style: InspectStyleSpecification) {
  return style.metadata && style.metadata['maplibregl-inspect:inspect'];
}

function markInspectStyle(style: StyleSpecification) {
  return Object.assign(style, {
    metadata: Object.assign({}, style.metadata, {
      'maplibregl-inspect:inspect': true
    })
  });
}

/** 
 * This is the main type for the available options for MapLibre Inspect
 */
export type MaplibreInspectOptions = {
  /**
   * Show the inspect map
   * @default false
   */
  showInspectMap?: boolean;
  /**
   * Show the inspect button
   * @default true
   */
  showInspectButton?: boolean;
  /**
   * Show the map popup
   * @default false
   */
  showMapPopup?: boolean;
  /**
   * Show the map popup on hover
   * @default true
   */
  showMapPopupOnHover?: boolean;
  /**
   * Show the inspect map popup
   * @default true
   */
  showInspectMapPopup?: boolean;
  /**
   * Show the inspect map popup on hover
   * @default true
   */
  showInspectMapPopupOnHover?: boolean;
  /**
   * Block hover popup on click
   * @default false
   */
  blockHoverPopupOnClick?: boolean;
  /**
   * Background color for the inspect map
   * @default '#fff'
   */
  backgroundColor?: string;
  assignLayerColor?: (layerId: string, alpha: number) => string;
  buildInspectStyle?: (originalMapStyle: StyleSpecification, coloredLayers: LayerSpecification[], opts: {backgroundColor?: string}) => StyleSpecification;
  renderPopup?: (features: GeoJSONFeatureWithSourceLayer[]) => string | HTMLElement;
  /**
   * Maplibre GL Popup
   */
  popup?: Popup;
  /**
   * Select threshold
   * @default 5
   */
  selectThreshold?: number;
  /**
   * Use inspect style
   * @default true
   */
  useInspectStyle?: boolean;
  /**
   * Query parameters for querying rendered features
   */
  queryParameters?: QueryRenderedFeaturesOptions;
  /**
   * Sources to be used for inspecting, setting this will disable the automatic source detection.
   * This is a dictionary containing the source IDs and their vector layer IDs
   */
  sources?: {[key: string]: string[]};
  /**
   * Callback for toggling the inspect map
   */
  toggleCallback?: (showInspectMap: boolean) => void;
};

/**
 * Maplibre Inspect Control
 */
class MaplibreInspect implements IControl {
  options: Required<MaplibreInspectOptions>;
  sources: {[key: string]: string[]};
  assignLayerColor: (layerId: string, alpha: number) => string;
  /**
   * @hidden
   */
  _popup: Popup;
  /**
   * @hidden
   */
  _popupBlocked: boolean;
  /**
   * @hidden
   */
  _showInspectMap: boolean;
  /**
   * @hidden
   */
  _originalStyle: StyleSpecification | undefined;
  /**
   * @hidden
   */
  _toggle: InspectButton;
  /**
   * @hidden
   */
  _map: Map | undefined;

  constructor(options: MaplibreInspectOptions) {
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
      toggleCallback() {},
      manageStyleOutside: false
    }, options);

    this.sources = this.options.sources;
    this.assignLayerColor = this.options.assignLayerColor;
    this._popup = this.options.popup;
    this._popupBlocked = false;
    this._showInspectMap = this.options.showInspectMap;

    this._toggle = new InspectButton({
      show: this.options.showInspectButton,
      onToggle: () => this.toggleInspector()
    });
  }

  public toggleInspector() {
    this._showInspectMap = !this._showInspectMap;
    this._popupBlocked = false;
    this.options.toggleCallback(this._showInspectMap);
    this.render();
  }

  public _inspectStyle() {
    const coloredLayers = stylegen.generateColoredLayers(this.sources, this.assignLayerColor);
    return this.options.buildInspectStyle(this._map!.getStyle(), coloredLayers, {
      backgroundColor: this.options.backgroundColor
    });
  }

  public render() {
    if (this._showInspectMap) {
      if (this.options.useInspectStyle) {
        this._map!.setStyle(markInspectStyle(this._inspectStyle()));
      }
      this._toggle.setMapIcon();
    } else if (this._originalStyle) {
      if (this._popup) this._popup.remove();
      if (this.options.useInspectStyle) {
        this._map!.setStyle(this._originalStyle);
      }
      this._toggle.setInspectIcon();
    }
  }

  private _setSourcesFromMap() {
    //NOTE: This heavily depends on the internal API of Maplibre GL
    //so this breaks between Maplibre GL JS releases
    const mapStyleSourcesNames = Object.keys(this._map!.getStyle().sources);
    Object.keys(this._map!.style.sourceCaches).forEach((sourceId) => {
      const sourceCache = this._map!.style.sourceCaches[sourceId] || {_source: {}};
      const layerIds = sourceCache._source.vectorLayerIds;
      if (layerIds) {
        this.sources[sourceId] = layerIds;
      } else if (sourceCache._source.type === 'geojson') {
        this.sources[sourceId] = [];
      }
    });

    Object.keys(this.sources).forEach((sourceId) => {
      if (mapStyleSourcesNames.indexOf(sourceId) === -1) {
        delete this.sources[sourceId];
      }
    });
  }

  public _onSourceChange = (e: MapSourceDataEvent) => {
    if (e.sourceDataType ===  'visibility' || !e.isSourceLoaded) {
      return;
    }
    const previousSources = Object.assign({}, this.sources);  
    this._setSourcesFromMap();

    if (!isEqual(previousSources, this.sources) && Object.keys(this.sources).length > 0) {
      // If the sources have changed, we need to re-render the inspect style but not too fast
      setTimeout(() => this.render(), 1000);
    }
  };

  /**
   * This will set the original style of the map
   * It will also update the sources assuming the map has already been loaded
   * @param style - The original style
   */
  public setOriginalStyle(style: StyleSpecification) {
    this._originalStyle = style;
    this._setSourcesFromMap();
  }

  public _onStyleChange = () => {
    const style = this._map!.getStyle();
    if (!isInspectStyle(style as InspectStyleSpecification)) {
      this._originalStyle = style;
    }
  };

  public _onRightClick = () => {
    if (!this.options.showMapPopupOnHover && !this.options.showInspectMapPopupOnHover && !this.options.blockHoverPopupOnClick) {
      if (this._popup) this._popup.remove();
    }
  };

  public _onMousemove = (e: MapMouseEvent) => {
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
      let queryBox: PointLike | [PointLike, PointLike];
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

      const features = this._map!.queryRenderedFeatures(queryBox, this.options.queryParameters) || [];
      this._map!.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
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

        this._popup.addTo(this._map!);
      }
    }
  };

  /** @inheritdoc */
  public onAdd(map: Map) {
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
  }

  /** @inheritdoc */
  public onRemove() {
    this._map!.off('styledata', this._onStyleChange);
    this._map!.off('load', this._onStyleChange);
    this._map!.off('tiledata', this._onSourceChange);
    this._map!.off('sourcedata', this._onSourceChange);
    this._map!.off('mousemove', this._onMousemove);
    this._map!.off('click', this._onMousemove);
    this._map!.off('contextmenu', this._onRightClick);

    const elem = this._toggle.elem;
    elem.parentNode!.removeChild(elem);
    this._map = undefined;
  }
}
export default MaplibreInspect;
