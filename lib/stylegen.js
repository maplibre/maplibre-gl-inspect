function circleLayer(color, source, vectorLayer) {
  const layer = {
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

function polygonLayer(color, outlineColor, source, vectorLayer) {
  const layer = {
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

function lineLayer(color, source, vectorLayer) {
  const layer = {
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
 * TODO: Improve docs
 * @param {Object} Sources dict containing the vector layer IDs
 * @param {Function} Function to generate a color for a layer
 * @return {array} Array of Maplibre GL layers
 */
function generateColoredLayers(sources, assignLayerColor) {
  const polyLayers = [];
  const circleLayers = [];
  const lineLayers = [];

  function alphaColors(layerId) {
    const color = assignLayerColor.bind(null, layerId);
    const obj = {
      circle: color(0.8),
      line: color(0.6),
      polygon: color(0.3),
      polygonOutline: color(0.6),
      default: color(1)
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
      layers.forEach((layerId) => {
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
 * @param {Object} Original map styles
 * @param {array} Array of colored Maplibre GL layers
 * @return {Object} Colored inspect style
 */
function generateInspectStyle(originalMapStyle, coloredLayers, opts) {
  opts = Object.assign({
    backgroundColor: '#fff'
  }, opts);

  const backgroundLayer = {
    'id': 'background',
    'type': 'background',
    'paint': {
      'background-color': opts.backgroundColor
    }
  };

  const sources = {};
  Object.keys(originalMapStyle.sources).forEach((sourceId) => {
    const source = originalMapStyle.sources[sourceId];
    if (source.type === 'vector' || source.type === 'geojson') {
      sources[sourceId] = source;
    }
  });

  return Object.assign(originalMapStyle, {
    layers: [backgroundLayer].concat(coloredLayers),
    sources
  });
}

exports.polygonLayer = polygonLayer;
exports.lineLayer = lineLayer;
exports.circleLayer = circleLayer;
exports.generateInspectStyle = generateInspectStyle;
exports.generateColoredLayers = generateColoredLayers;
