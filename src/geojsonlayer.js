define([
    "dojo/_base/declare",
    "esri/graphic",
    "esri/layers/GraphicsLayer",
    "esri/InfoTemplate",
    "esri/graphicsUtils",
    "esri/Color",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/renderers/SimpleRenderer",
    "esri/SpatialReference",
    "esri/geometry/webMercatorUtils",
    "esri/request",
    "esri/config",
    "dojo/_base/url",
    "dojo/_base/lang"
],  function (declare, Graphic, GraphicsLayer, InfoTemplate, graphicsUtils, Color, SimpleMarkerSymbol,
        SimpleLineSymbol, SimpleFillSymbol, SimpleRenderer, SpatialReference, webMercatorUtils, esriRequest, esriConfig, Url, lang
    ) {
    return declare([GraphicsLayer], {

        // Required Terrformer library reference
        _terrafomer: (typeof Terraformer !== 'undefined') ? Terraformer : null,

        constructor: function (options) {
            // options:
            //      url: String
            //          Path to file or server endpoint. Server must be on the same domain or cors enabled. Or use a proxy.
            //      data: Object[]
            //          Optional: FeatureCollection of GeoJson features. This will override url if both are provided.
            //      maxdraw: Number
            //          Optional: The maximum graphics to render. Default is 1000.
            this._validState = true;
            // First look for url
            this._url = options.url;
            // Accept data as geojson features array. This will override options.url!
            this._data = options.data;
            // GeoJSON spatial reference (not optional)
            this._inSpatialReference = new SpatialReference({wkid: 4326});  // Data must be in Geographic Coordinates
            // GeoJSON transformation (optional)
            this._outSpatialReference = null;
            // Default popup
            if (options.infoTemplate !== false) {
                this.setInfoTemplate(options.infoTemplate || new InfoTemplate("GeoJSON Data", "${*}"));
            }
            // Renderer
            if (options.renderer) {
                this.renderer = options.renderer;
            }
            // Default symbols
            this._setDefaultSymbols();
            // Enable browser to make cross-domain requests
            this._setCorsSevers();
            this._setXhrDefaults(10000);
            // Manage drawing
            this._maxDraw = options.maxdraw || 1000;  // default to 1000 graphics
            this._drawCount = 0;
            this._drawCountTotal = 0;
            // Extended public properties
            this.extent = null;
            // Graphics layer does not call onLoad natively but we'll call it after features have been added to layer
            if (options.onLoad && typeof options.onLoad === 'function') {
                this.onLoad = options.onLoad;
            }
            // Make sure the environment is good to go!
            this._updateState();
        },

        _setDefaultSymbols: function () {
            function getRandomColor(mainColor, transparency) {
                function getRandomInt(min, max) {
                    return Math.floor(Math.random() * (max - min + 1)) + min;
                }
                switch (mainColor) {
                    case "red":
                        return new Color([getRandomInt(150, 255), getRandomInt(0, 255), getRandomInt(0, 255), transparency]);
                    case "green":
                        return new Color([getRandomInt(0, 155), getRandomInt(150, 255), getRandomInt(0, 155), transparency]);
                    case "blue":
                        return new Color([getRandomInt(0, 255), getRandomInt(0, 255), getRandomInt(150, 255), transparency]);
                }
            }
            // Random colors
            this._simplePointSym = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 8,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, getRandomColor("blue", 0.5), 1),
                    getRandomColor("blue", 0.75));
            this._simpleLineSym = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, getRandomColor("red", 0.9), 2);
            this._simplePolygonSym = new SimpleFillSymbol("solid",
                    new SimpleLineSymbol("solid", new Color([50, 50, 50, 0.15]), 1),
                    getRandomColor("green", 0.15));
            // Option to hardcod colors here
            // this._simplePointSym = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 8,
            //      new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([150, 150, 150]), 0.5),
            //      new Color([50, 130, 255, 0.75]));
            // this._simpleLineSym = new SimpleLineSymbol("solid", new Color([255, 50, 50, 0.75]), 2);
            // this._simplePolygonSym = new SimpleFillSymbol("solid",
            //         new SimpleLineSymbol("solid", new Color([0, 0, 0, 0.10]), 1),
            //         new Color([150, 255, 150, 0.10]));
        },

        _setCorsSevers: function () {
            // Allow browser to make cross-domain requests
            esriConfig.defaults.io.corsEnabledServers.push("http://sampleserver6.arcgisonline.com");
            // Add server
            if (this._url) {
                var url = new Url(this._url),
                    scheme = url.scheme,
                    host = url.host,
                    port = url.port,
                    server = scheme + "://" + host; // + "/"; // + (port ? port : ""); // TODO
                if (scheme && host) {
                    esriConfig.defaults.io.corsEnabledServers.push(server);
                }
            }
        },

        _setXhrDefaults: function (postSize) {
            esriConfig.defaults.io.postLength = postSize;  // max size of post request
        },

        _updateState: function () {
            if (!this._inSpatialReference) {
                this._validState = false;
                console.error("GeoJsonLayer Error: Invalid SpatialReference.");
            }
            if (!this._terrafomer) {
                this._validState = false;
                console.error("GeoJsonLayer Error: Invalid Terraformer reference. Please add a reference to your html page.");
            }
        },

        // GraphicLayer overrides
        _setMap: function (map, surface) {
            var div = this.inherited(arguments);
            // Check spatial reference
            if (!this._validState) {
                return div;
            }
            // Set sr if need to project
            this._outSpatialReference = map.spatialReference;
            // Load GeoJSON as graphics
            this._loadGeoJson();
            // Return div - sets this.id
            return div;
        },

        _unsetMap: function () {
            return this.inherited(arguments);
        },

        add: function (graphic) {
            if (!this._validState) {
                return;
            }
            // Can do more with graphic if needed
            this.inherited(arguments);
            this._incrementDrawCount();
            return;
        },

        clear: function () {
            this._drawCount = 0;
            this._drawCountMax = 0;
            return this.inherited(arguments);
        },

        // GeoJsonLayer class functions
        _loadGeoJson: function () {
            if (this._data) {
                // Load data
                this._getGeoJson(this._data);
            } else if (this._url) {
                 // XHR request
                this._getGeoJsonXhr(this._url);
            }
        },

        _getGeoJsonXhr: function (url) {
            // xhr request to get data
            var requestHandle = esriRequest({
                url: url,
                handleAs: "json"
            });
            requestHandle.then(lang.hitch(this, this._getGeoJson),
                lang.hitch(this, this._errorGetGeoJsonXhr));
        },

        _getGeoJson: function (geojson) {
            // Check data
            if (geojson.type !== "FeatureCollection" || !geojson.features) {
                console.error("GeoJsonLayer Error: Invalid GeoJSON FeatureCollection. Check url or data structure.");
                return;
            }
            // Convert GeoJSON to ArcGIS JSON
            var arcgisJson = this._terraformerConverter(geojson);
            // Add graphics to layer
            this._addGraphics(arcgisJson);
        },

        // GeoJSON to ArcGIS JSON
        _terraformerConverter: function (geojson) {
            var json,
                arcgis;
            // Convert the geojson object to a Primitive json representation
            json = new this._terrafomer.Primitive(geojson);
            // Convert to ArcGIS JSON
            arcgis = this._terrafomer.ArcGIS.convert(json);
            return arcgis;
        },

        _errorGetGeoJsonXhr: function (e) {
            console.error("GeoJsonLayer Error: Couldn't load GeoJSON. Check url. File must be on the same domain or server must be CORS enabled.\n\n" + e);
        },

        _incrementDrawCount: function () {
            this._drawCount++;
            if (this._drawCount === this._drawCountTotal) {
                this._updateLayerExtent();
                this.onUpdateEnd();
            }
        },

        _decrementDrawCount: function () {
            this._drawCountTotal--;
        },

        _updateLayerExtent: function () {
            var extent;
            if (this.graphics.length) {
                extent = graphicsUtils.graphicsExtent(this.graphics);
            }
            this.extent = extent;
        },

         // Type functions
        _getEsriSymbol: function (geometryType) {
            var sym;
            switch (geometryType) {
            case "point":
                sym = this._simplePointSym;
                break;
            case "multipoint":
                sym = this._simplePointSym;
                break;
            case "polyline":
                sym = this._simpleLineSym;
                break;
            case "polygon":
                sym = this._simplePolygonSym;
                break;
            case "extent":
                sym = this._simplePolygonSym;
                break;
            }
            return sym;
        },

        _addGraphicToLayer: function (graphic) {
            // Add or project and then add graphic
            if (this._inSpatialReference.wkid === 4326 || this._inSpatialReference.wkid === 102100) {
                // ArcGIS API automatically translates between these!
                // if (graphic.geometry.spatialReference.wkid === 4326) {
                //     graphic.setGeometry(webMercatorUtils.geographicToWebMercator(graphic.geometry));
                // }
                // Add graphic directly
                this.add(graphic);
            }
        },

        _createGraphic: function (arcgisJson) {
            var graphic;
            // This magically sets geometry type!
            graphic = new Graphic(arcgisJson);
            // Set the correct symbol based on type and render - NOTE: Only supports simple renderers
            if (this.renderer && this.renderer.symbol) {
                //graphic.setSymbol(this.render.getSymbol(graphic));  // use for complex renderers
                graphic.setSymbol(this.renderer.symbol);
            } else {
                graphic.setSymbol(this._getEsriSymbol(graphic.geometry.type));
            }
            // Update SR because terraformer sets incorrect spatial reference
            graphic.geometry.setSpatialReference(this._inSpatialReference); // NOTE: Has to match features!
            return graphic;
        },

        _addGraphics: function (arcgisJson) {
            var i,
                feature,
                graphic;
            // Limit size of data that can be drawn
            if (arcgisJson.length > this._maxDraw) {
                this._drawCountTotal = this._maxDraw;
                console.warn("GeoJsonLayer Warning: Large dataset detected. Only drawing the first " + this._maxDraw + " features!");
            } else {
                this._drawCountTotal = arcgisJson.length;
            }
            // Add graphics to the layer with symbols, project if needed
            for (i = 0; i < this._drawCountTotal; i++) {
                feature = arcgisJson[i];
                // Create graphic - magically sets the geometry type!
                graphic = this._createGraphic(feature);
                // Add to layer
                this._addGraphicToLayer(graphic);
            }
            // Call onLoad
            // emit mixes in `layer` and `target` properties as event object
            // onLoad provided via constructor just returns `layer` object
            this.onLoad(this);
        }
    });
});