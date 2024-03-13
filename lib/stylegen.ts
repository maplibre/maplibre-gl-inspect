import type { LayerSpecification, StyleSpecification } from "maplibre-gl";

function circleLayer(color: string, source: string, vectorLayer?: string) {
  const layer: LayerSpecification = {
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

function polygonLayer(color: string, _outlineColor: string, source: string, vectorLayer?: string) {
  const layer: LayerSpecification = {
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

function lineLayer(color: string, source: string, vectorLayer?: string) {
  const layer: LayerSpecification = {
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

/**
 * Generate colored layer styles for the given sources
 * @param sources dictionary containing the vector layer IDs
 * @param Function to generate a color for a layer
 * @return Array of Maplibre GL layers
 */
function generateColoredLayers(sources: {[key: string]: string[]}, assignLayerColor: (layerId: string, alpha: number) => string): LayerSpecification[] {
  const polyLayers: LayerSpecification[] = [];
  const circleLayers: LayerSpecification[] = [];
  const lineLayers: LayerSpecification[] = [];

  function alphaColors(layerId: string) {
    const obj = {
      circle: assignLayerColor(layerId, 0.8),
      line: assignLayerColor(layerId, 0.6),
      polygon: assignLayerColor(layerId, 0.3),
      polygonOutline: assignLayerColor(layerId, 0.6),
      default: assignLayerColor(layerId, 1)
    };
    return obj;
  }

  Object.keys(sources).forEach((sourceId) => {
    const layers = sources[sourceId];

    if (!layers || layers.length === 0) {
      const colors = alphaColors(sourceId);
      circleLayers.push(circleLayer(colors.circle, sourceId));
      lineLayers.push(lineLayer(colors.line, sourceId));
      polyLayers.push(polygonLayer(colors.polygon, colors.polygonOutline, sourceId));
    } else {
      layers.forEach((layerId: string) => {
        const colors = alphaColors(layerId);

        circleLayers.push(circleLayer(colors.circle, sourceId, layerId));
        lineLayers.push(lineLayer(colors.line, sourceId, layerId));
        polyLayers.push(polygonLayer(colors.polygon, colors.polygonOutline, sourceId, layerId));
      });
    }
  });

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
  Object.keys(originalMapStyle.sources).forEach((sourceId) => {
    const source = originalMapStyle.sources[sourceId];
    if (source.type === 'vector' || source.type === 'geojson') {
      sources[sourceId] = source;
    }
  });

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
