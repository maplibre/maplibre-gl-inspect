import type { CircleLayerSpecification, FillLayerSpecification, LayerSpecification, LineLayerSpecification, StyleSpecification } from "maplibre-gl";

function circleLayer(color: string, source: string, vectorLayer?: string): CircleLayerSpecification {
  const layer: CircleLayerSpecification = {
    id: [source, vectorLayer, 'circle'].join('_'),
    source,
    type: 'circle',
    paint: {
      'circle-color': color,
      'circle-radius': 2
    },
    filter: ['==', '$type', 'Point']
  };
  if (vectorLayer) {
    layer['source-layer'] = vectorLayer;
  }
  return layer;
}

function polygonLayer(color: string, _outlineColor: string, source: string, vectorLayer?: string): FillLayerSpecification {
  const layer: FillLayerSpecification = {
    id: [source, vectorLayer, 'polygon'].join('_'),
    source,
    type: 'fill',
    paint: {
      'fill-color': color,
      'fill-antialias': true,
      'fill-outline-color': color
    },
    filter: ['==', '$type', 'Polygon']
  };
  if (vectorLayer) {
    layer['source-layer'] = vectorLayer;
  }
  return layer;
}

function lineLayer(color: string, source: string, vectorLayer?: string): LineLayerSpecification {
  const layer: LineLayerSpecification = {
    id: [source, vectorLayer, 'line'].join('_'),
    source,
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    type: 'line',
    paint: {
      'line-color': color
    },
    filter: ['==', '$type', 'LineString']
  };
  if (vectorLayer) {
    layer['source-layer'] = vectorLayer;
  }
  return layer;
}

function alphaColors(layerId: string, assignLayerColor: (layerId: string, alpha: number) => string) {
  const obj = {
    circle: assignLayerColor(layerId, 0.8),
    line: assignLayerColor(layerId, 0.6),
    polygon: assignLayerColor(layerId, 0.3),
    polygonOutline: assignLayerColor(layerId, 0.6),
    default: assignLayerColor(layerId, 1)
  };
  return obj;
}

/**
 * Generate colored layer styles for the given sources
 * @param sources dictionary containing the vector layer IDs
 * @param assignLayerColor to generate a color for a layer
 * @return Array of Maplibre GL layers
 */
function generateColoredLayers(sources: {[key: string]: string[]}, assignLayerColor: (layerId: string, alpha: number) => string): LayerSpecification[] {
  const polyLayers: LayerSpecification[] = [];
  const circleLayers: LayerSpecification[] = [];
  const lineLayers: LayerSpecification[] = [];

  for (const sourceId of Object.keys(sources)) {
    const layers = sources[sourceId];

    if (!layers || layers.length === 0) {
      const colors = alphaColors(sourceId, assignLayerColor);
      circleLayers.push(circleLayer(colors.circle, sourceId));
      lineLayers.push(lineLayer(colors.line, sourceId));
      polyLayers.push(polygonLayer(colors.polygon, colors.polygonOutline, sourceId));
    } else {
      for (const layerId of layers) {
        const colors = alphaColors(layerId, assignLayerColor);

        circleLayers.push(circleLayer(colors.circle, sourceId, layerId));
        lineLayers.push(lineLayer(colors.line, sourceId, layerId));
        polyLayers.push(polygonLayer(colors.polygon, colors.polygonOutline, sourceId, layerId));
      }
    }
  }

  return polyLayers.concat(lineLayers).concat(circleLayers);
}

/**
 * Create inspection style out of the original style and the new colored layers
 * @param originalMapStyle - map style
 * @param coloredLayers - array of colored Maplibre GL layers
 * @param opts - options
 * @return {Object} Colored inspect style
 */
function generateInspectStyle(originalMapStyle: StyleSpecification, coloredLayers: LayerSpecification[], opts: {backgroundColor?: string}): StyleSpecification {
  opts = Object.assign({
    backgroundColor: '#fff'
  }, opts);

  const backgroundLayer: LayerSpecification = {
    'id': 'background',
    'type': 'background',
    'paint': {
      'background-color': opts.backgroundColor
    }
  };

  const sources: StyleSpecification["sources"] = {};
  for (const sourceId of Object.keys(originalMapStyle.sources)) {
    const source = originalMapStyle.sources[sourceId];
    if (source.type === 'vector' || source.type === 'geojson') {
      sources[sourceId] = source;
    }
  }

  return Object.assign(originalMapStyle, {
    layers: ([backgroundLayer] as LayerSpecification[]).concat(coloredLayers),
    sources
  });
}

export default {
  polygonLayer,
  lineLayer,
  circleLayer,
  generateInspectStyle,
  generateColoredLayers
}
