# geojson-layer-js

> NOTE: The ArcGIS API for JavaScript 4 now supports a native [GeoJSONLayer](https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-GeoJSONLayer.html). Please use [GeoJSONLayer](https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-GeoJSONLayer.html) moving forward.

An easy way to load GeoJSON resources into your [ArcGIS](https://developers.arcgis.com/javascript/) map. This is a simple custom layer that uses [Terraformer](http://terraformer.io) to convert GeoJSON to ArcGIS JSON.  It "should" support all GraphicLayer operations. e.g. popups, rendering... 

[View demo app live](http://esri.github.io/geojson-layer-js/geojsonlayer.html)

![App](https://raw.github.com/Esri/geojson-layer-js/master/geojson-layer-js.png)

## Features
* Load GeoJSON from a file
* Load GeoJSON from a server 
* Load GeoJSON data from a FeatureCollection

## Usage
``` JavaScript
// Example 1: Load from a file
var geoJsonLayer1 = new GeoJsonLayer({
    url: "http://www.myCorsEnabledServer.com/canada.json"
});

// Example 2: Load from a server
var geoJsonLayer2 = new GeoJsonLayer({
    url: "http://opendata.dc.gov/datasets/81a9d9885947483aa2088d81b20bfe66_5.geojson"
});

// Example 3: Load from a FeatureCollection
var geoJsonLayer3 = new GeoJsonLayer({
    data: myFeatureCollection 
});

// Add to map
map.addLayer(geoJsonLayer1);
map.addLayer(geoJsonLayer2);
map.addLayer(geoJsonLayer3);
```

``` JavaScript
// options:
//      url: String
//          Path to file or server endpoint. Server must be on the same domain or cors enabled. Or use a proxy.
//      data: Object[]
//          Optional: FeatureCollection of GeoJson features. This will override url if both are provided.
//      maxdraw: Number
//          Optional: Limit the maximum graphics to draw. Default is 1000.
```

## Developer Notes 
* All GeoJSON data needs to be in geographic coordinates [(wkid 4326)](https://developers.arcgis.com/javascript/jsapi/spatialreference-amd.html).
* All GeoJSON resources must reside on the same domain as the app unless a [CORS enabled server](https://developers.arcgis.com/javascript/jshelp/ags_proxy.html) or a [proxy](https://developers.arcgis.com/javascript/jshelp/ags_proxy.html) is used. NOTE: GitHub gh-pages servers are not CORS enabled!
* Terraformer does not support dojo require() and must be loaded directly into the page.

``` HTML
<!-- Terraformer -->
<script src="./vendor/terraformer/terraformer.min.js"></script>
<script src="./vendor/terraformer-arcgis-parser/terraformer-arcgis-parser.min.js"></script>
```

## Example
``` HTML
<!DOCTYPE html> 
<html>  
<head> 
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=7,IE=9">
<meta name="viewport" content="initial-scale=1, maximum-scale=1,user-scalable=no">
<title>ArcGIS GeoJSON Layer</title>  
<!-- ArcGIS API for JavaScript CSS-->
<link rel="stylesheet" href="//js.arcgis.com/3.9/js/esri/css/esri.css">
<!-- Web Framework CSS - Bootstrap (getbootstrap.com) and Bootstrap-map-js (github.com/esri/bootstrap-map-js) -->
<link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="//esri.github.io/bootstrap-map-js/src/css/bootstrapmap.css">
<style>
html, body, #mapDiv {
  height: 100%;
  width: 100%;
}
</style>

<!-- ArcGIS API for JavaScript library references -->
<script src="//js.arcgis.com/3.10"></script>

<!-- Terraformer reference -->
<script src="./vendor/terraformer/terraformer.min.js"></script>
<script src="./vendor/terraformer-arcgis-parser/terraformer-arcgis-parser.min.js"></script>

<script>
    require(["esri/map",
        "./src/geojsonlayer",
        "dojo/on",
        "dojo/dom",
        "dojo/domReady!"],
      function (Map, GeoJsonLayer, on, dom) {

        // Create map
        var map = new Map("mapDiv", {
            basemap: "gray",
            center: [-122.5, 45.5],
            zoom: 5
        });

        map.on("load", function () {
            addGeoJsonLayer("./data/dc-schools.json");
        });

        // Add the layer
        function addGeoJsonLayer(url) {
            // Create the layer
            var geoJsonLayer = new GeoJsonLayer({
                url: url
            });
            // Zoom to layer
            geoJsonLayer.on("update-end", function (e) {
                map.setExtent(e.target.extent.expand(1.2));
            });
            // Add to map
            map.addLayer(geoJsonLayer);
        }
    });
</script>
</head>
<body>
    <div id="mapDiv"></div>
</body>
</html>
```

## Requirements

* [ArcGIS for JavaScript API](https://developers.arcgis.com/javascript/)
* [Terraformer](http://terraformer.io)

## Resources

* [ArcGIS for JavaScript API Resource Center](https://developers.arcgis.com/javascript/)
* [ArcGIS Blog](http://blogs.esri.com/esri/arcgis/)
* [twitter@esri](http://twitter.com/esri)

## Issues

Find a bug or want to request a new feature?  Please let us know by submitting an issue.  Thank you!

## Contributing

Anyone and everyone is welcome to contribute. Please see our [guidelines for contributing](https://github.com/esri/contributing).

## Licensing
Copyright 2013 Esri

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's [license.txt]( https://raw.github.com/Esri/geojson-layer-js/master/license.txt) file.

[](Esri Tags: ArcGIS Web Mapping GeoJSON Layer Terraformer Projections)
[](Esri Language: JavaScript)
