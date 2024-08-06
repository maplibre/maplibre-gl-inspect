# Maplibre GL Inspect

Maplibre GL Inspect is a fork of Mapbox GL Inspect by lukasmartinelli ( https://github.com/lukasmartinelli/mapbox-gl-inspect ). It was forked to add support for maplibre-gl-js.

Add an inspect control to [maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js) to view all features
of the vector sources and allows hovering over features to see their properties.

**Requires [maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js) (min version 1.15).**

![Maplibre GL Inspect Preview](https://cloud.githubusercontent.com/assets/1288339/21744637/11759412-d51a-11e6-9581-f26741fcd182.gif)

## Quick Start

**maplibre-gl-inspect** is a Maplibre GL JS plugin that you can easily add on top of your map.

Make sure to include the CSS and JS files.

**When using a CDN**

```html
<script src='https://unpkg.com/@maplibre/maplibre-gl-inspect@latest/dist/maplibre-gl-inspect.js'></script>
<link href='https://unpkg.com/@maplibre/maplibre-gl-inspect@latest/dist/maplibre-gl-inspect.css' rel='stylesheet' />
```

**When using modules**

```js
import '@maplibre/maplibre-gl-inspect/dist/maplibre-gl-inspect.css';
import maplibregl from 'maplibre-gl';
import MaplibreInspect from '@maplibre/maplibre-gl-inspect';

// Pass an initialized popup to Maplibre GL
map.addControl(new MaplibreInspect({
  popup: new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false
  })
}));
```

## Documentation

The docs can be found here:
https://maplibre.org/maplibre-gl-inspect/

The docs have two main sections - the API and the examples.
In order to see the examples' code either go to the examples folder in this repo, or press inspect in the browser to see the code.
It is written in plain html, no extra javascript files in order to have it as simple as possible.

## Short Examples

### Add Inspect Control

Add the inspect control to your map.

```javascript
map.addControl(new MaplibreInspect());
```


### Show Inspection Map

Switch to the inspection map by default.

```javascript
map.addControl(new MaplibreInspect({
  showInspectMap: true
}));
```

### Show only Inspection Mode

Switch to the inspection map by default and hide the inspect button to switch back to the normal map. Check `examples/inspect-only.html`


```javascript
map.addControl(new MaplibreInspect({
  showInspectMap: true,
  showInspectButton: false
}));
```

### Disable Popup

Disable the feature Popup in inspection mode and in map mode. Check `examples/no-popup.html`

```javascript
map.addControl(new MaplibreInspect({
  showInspectMapPopup: false,
  showMapPopup: false
}));
```

### Custom Popup Function

You can also control the Popup output. Check `examples/custom-popup.html`

```javascript
map.addControl(new MaplibreInspect({
  renderPopup: (features) => {
    return '<h1>' + features.length + '</h1>';
  }
}));
```

### Custom Color Function

You are able to control the generated colors and background of the inspection style.
Check `examples/custom-color-1.html` and `examples/custom-color-2.html`.

```javascript
var colors = ['#FC49A3', '#CC66FF', '#66CCFF', '#66FFCC'];
map.addControl(new MaplibreInspect({
  backgroundColor: '#000',
  assignLayerColor: (layerId, alpha) => {
    var randomNumber = parseInt(Math.random() * colors.length);
    return colors[randomNumber];
   }
}));
```

### Show just Popup but no Inspect Style

You can also hide the inspect button and enable the popup on the map if just want the popup hovering feature in your normal map but no inspect style.
Check `examples/no-inspect-style.html`.


```js
map.addControl(new MaplibreInspect({
  showInspectButton: false,
  showMapPopup: true
}));
```

### Show Popup only for certain Features

You can pass a `queryParameters` object structured like the parameters object documented for `map.queryRenderedFeatures`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#queryrenderedfeatures).
This let's you show the inspect popup for only certain layers.
Check `examples/query-params.html`.


```js
map.addControl(new MaplibreInspect({
  queryParameters: {
    layers: ['composite_road_line']
  }
}));
```

You can also use this feature to do custom layer [filtering](https://maplibre.org/maplibre-style-spec/expressions/).

```js
map.addControl(new MaplibreInspect({
  queryParameters: {
    filter: ['>', 'height', 10]
  }
}));
```

### Less Fidly Popup

If inspecting features is too fiddly for thin lines you can optionally set a custom pixel buffer around the pointer when querying for features to make inspection a bit more forgiving.
Check `examples/less-fidly.html`.


```js
map.addControl(new MaplibreInspect({
  selectThreshold: 50
}));
```

### Show Popup only on Click not on Hovering

Do not show the inspect popup when hovering over the map but only when clicking on the map.
Check `examples/popup-on-click.html`.


```js
map.addControl(new MaplibreInspect({
  showMapPopup: true,
  showMapPopupOnHover: false,
  showInspectMapPopupOnHover: false
}));
```

### Add a Callback for Inspect Toggle Events

Call a function whenever the user toggles the inpect map on or off. Useful for adding inspect state to URL hash.
Check `examples/url-hash-toggle-callback.html`.

```js
map.addControl(new MaplibreInspect({
  toggleCallback: (showInspectMap) => { 
    console.log(`showInspectMap is ${showInspectMap}`);
  }
}));
```

## Develop

To build the library:

```
npm install
npm run build-dist
```

To see how it behaves

```
npm install
npm run build-dist
npm run start
```

This will start a local server, surf to it and to the `examples` folder to see changes in the code.
