import type { MapGeoJSONFeature } from "maplibre-gl";

/**
 * A GeoJSON feature with a source layer
 */
export type GeoJSONFeatureWithSourceLayer = MapGeoJSONFeature & { layer: {'source-layer'?: string} };

function displayValue(value: unknown) {
  if (typeof value === 'undefined' || value === null) return value;
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object' ||
          typeof value === 'number' ||
          typeof value === 'string') return value.toString();
  return value;
}

function renderProperty(propertyName: string, property: unknown) {
  return `${'<div class="maplibregl-inspect_property">' +
    '<div class="maplibregl-inspect_property-name">'}${propertyName}</div>` +
    `<div class="maplibregl-inspect_property-value">${displayValue(property)}</div>` +
    '</div>';
}

function renderLayer(layerId: string) {
  return `<div class="maplibregl-inspect_layer">${layerId}</div>`;
}

function renderProperties(feature: GeoJSONFeatureWithSourceLayer) {
  const sourceProperty = renderLayer(feature.layer['source-layer'] || feature.layer.source);
  const idProperty = renderProperty('$id', feature.id);
  const typeProperty = renderProperty('$type', feature.geometry.type);
  const properties = Object.keys(feature.properties).map(propertyName => renderProperty(propertyName, feature.properties[propertyName]));
  return [sourceProperty, idProperty, typeProperty].concat(properties).join('');
}

function renderFeatures(features: GeoJSONFeatureWithSourceLayer[]) {
  return features.map(ft => `<div class="maplibregl-inspect_feature">${renderProperties(ft)}</div>`).join('');
}

function renderPopup(features: GeoJSONFeatureWithSourceLayer[]) {
  return `<div class="maplibregl-inspect_popup">${renderFeatures(features)}</div>`;
}

export default renderPopup;
