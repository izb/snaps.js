/*global define*/
define(['map/tile',
        'util/bitmap',
        'util/debug',
        'util/js',
        'util/clock'],

function(Tile, Bitmap, debug, js, clock) {

    'use strict';

    /**
     * @module map/staggered-isometric
     */

    var debugText = debug.debugText;
    var copyProps = js.copyProps;
    var setProps  = js.setProps;

    var xy = [0,0]; // work area

    /** Represents a map of type 'staggered' created with the
     * {@link http://www.mapeditor.org/|tiled} map editor.
     * @constructor module:map/staggered-isometric.StaggeredIsometric
     * @param {Object} tileData The map's data, parsed from the JSON exported
     * map data.
     * @param {Object} hitTests An object of keys and values where the keys are
     * image names and the values are image paths that should be preloaded. These are
     * the hit test image maps.
     * @param {Number} clientWidth The width of the canvas client area
     * @param {Number} clientHeight The height of the canvas client area
     * @param {Object} [stats] An object that will receive new properties representing
     * runtime statistics, for debug purposes.
     */
    function StaggeredIsometric(tileData, hitTests, clientWidth, clientHeight, stats) {
        this.data          = tileData;
        this.hitTests      = hitTests;
        this.maxXOverdraw  = 0;
        this.maxYOverdraw  = 0;

        /**
         * The canvas width
         * @type {Number}
         * @member module:map/staggered-isometric.StaggeredIsometric#clientWidth
         */
        this.clientWidth   = clientWidth;

        /**
         * The canvas height
         * @type {Number}
         * @member module:map/staggered-isometric.StaggeredIsometric#clientHeight
         */
        this.clientHeight  = clientHeight;
        this.hideBuildings = false;

        this.type          = this.data.orientation;

        this.minxoffset    = this.data.tilewidth/2;
        this.minyoffset    = this.data.tileheight/2;

        this.maxxoffset    = this.data.width * this.data.tilewidth - this.clientWidth - 1;
        this.maxyoffset    = this.data.height * (this.data.tileheight/2) - this.clientHeight - 1;

        /* Start in SW-corner by default */
        this.xoffset       = this.minxoffset;
        this.yoffset       = this.maxyoffset;

        this.stats         = stats;
    }

    /**
     * @private
     * @method module:map/staggered-isometric.StaggeredIsometric#isStaggered
     * @return {Boolean} True if the map type is staggered isometric.
     */
    StaggeredIsometric.prototype.isStaggered = function() {
        /* TODO: Why in heck would a StaggeredIsometric class be managing
         * non-staggered map data? This exists only for the benefit of naive
         * unit tests in the pathfinder. */
        return this.type==='staggered';
    };

    /**
     * @private
     * @method module:map/staggered-isometric.StaggeredIsometric#isOrthogonal
     * @return {Boolean} True if the map type is orthogonal.
     */
    StaggeredIsometric.prototype.isOrthogonal = function() {
        /* TODO: Why in heck would a StaggeredIsometric class be managing
         * orthogonal map data? This exists only for the benefit of naive
         * unit tests in the pathfinder. */
        return this.type==='orthogonal';
    };

    /**
     * Returns the dimensions of one tile. Return value is via a 2-length
     * spanned array passed in as an output parameter.
     * @method module:map/staggered-isometric.StaggeredIsometric#tileDimensions
     * @param {Array} out An array of length 2 that will receive the tile dimensions,
     * x then y.
     */
    StaggeredIsometric.prototype.tileDimensions = function(out) {
        out[0] = this.data.tilewidth;
        out[1] = this.data.tileheight;
    };

    /**
     * Primes a preloader with the images required for a map (I.e. the tiles).
     * @method module:map/staggered-isometric.StaggeredIsometric#primePreloader
     * @param {Object} preloader A preloader object.
     */
    StaggeredIsometric.prototype.primePreloader = function(preloader) {

        /* TODO Docs link to preloader class. */

        var map   = this.data;
        var _this = this;

        /* Add tiles to the preloader */
        var storeTile = function(image, ts){
            ts.image = image;
        };

        for (var i = 0; i < map.tilesets.length; i++) {
            var ts = map.tilesets[i];
            preloader.addImage(ts.image, ts, storeTile);
        }

        var storeHitTest = function(image, name) {
            if (image.width!==map.tilewidth || image.height!==map.tileheight) {
                throw "Hit test image "+name+" does not match map tile size";
            }

            if (name==='hit') {
                _this.hitTest     = []; /* Red channel shows distance from closest edge in screen space, and can
                                         * be used to determine if a point lies on a tile. */
                _this.edgeNormals = []; /* Green channel points away from the closest edge at 90 degrees. */
                _this.worldEdgeDistance = []; /* Blue channel shows distance from closest edge in world space, and can
                                               * also be used to determine if a point lies on a tile. */
                Bitmap.imageToData(image, _this.hitTest, _this.edgeNormals, _this.worldEdgeDistance);

                /* Normals in vector form too. */
                _this.edgeNormalsX = new Array(_this.edgeNormals.length);
                _this.edgeNormalsY = new Array(_this.edgeNormals.length);
                /* Convert normals to radians for convenience */
                for (var i = _this.edgeNormals.length - 1; i >= 0; i--) {
                    var n = _this.edgeNormals[i];
                    n = (3*n*Math.PI)/180; /* Normal values are to the closes 3 degrees */
                    _this.edgeNormals[i] = n;
                    _this.edgeNormalsX[i] = Math.cos(n);
                    _this.edgeNormalsY[i] = -Math.sin(n);
                }

                /* TODO: It should be noted in documentation that the hit test image
                 * should under no circumstances be re-saved with a colour profile attached. */

                /* TODO: A unit test to ensure the integrity of the hitmap image data
                 * would be helpful. */
            } else {
                /* TODO: Figure out what to do with custom hit test images */
            }
        };

        for(var testName in this.hitTests) {
            preloader.addImage(this.hitTests[testName], testName, storeHitTest);
        }
    };

    var fixTypes = function(props) {
        if (props===undefined) {
            return props;
        }
        for (var prop in props) {
            if (prop==='height' && typeof props[prop]==='string') {
                props[prop] = parseInt(props[prop], 10);
            }
        }
        return props;
    };

    /** Get a tile by it's row and column position in the original map data.
     * @method module:map/staggered-isometric.StaggeredIsometric#getTile
     * @param  {Object} layer. The layer to search for tiles.
     * @param  {Number} c The column, aka x position in the data.
     * @param  {Number} r the row, aka y position in the data.
     * @return {Object} A tile, or null if the input was out of range.
     */
    StaggeredIsometric.prototype.getTile = function(layer, c, r) {
        /* TODO: Link to Tile class in documentation. */
        /* TODO: Validate that this is a tiled layer. */
        var rows = layer.rows;
        if (c<0||r<0 || r>=rows.length) {
            return null;
        }

        var row = rows[r];

        if (c>=row.length) {
            return null;
        }

        return row[c];
    };

    /**
     * @method module:map/staggered-isometric.StaggeredIsometric#resolveTiles
     * @private
     */
    StaggeredIsometric.prototype.resolveTiles = function() {

        var i, j, k, ts, tileprops;

        var map = this.data;

        for (k = map.tilesets.length - 1; k >= 0; k--) {
            ts = map.tilesets[k];
            ts.xspan = Math.floor(ts.imagewidth / ts.tilewidth);
            ts.yspan = Math.floor(ts.imageheight / ts.tileheight);
        }

        this.columns = this.rows = 0;

        for (i = 0; i < map.layers.length; i++) {
            var l = map.layers[i];
            this.columns = Math.max(this.columns, l.width);
            l.rows = [];
            var row = [];
            for (j = 0; j < l.data.length; j++) {
                var d = l.data[j];
                if (d===0) {
                    row.push(null);
                } else {
                    for (k = map.tilesets.length - 1; k >= 0; k--) {
                        ts = map.tilesets[k];
                        if(ts.firstgid<=d) {
                            break;
                        }
                    }
                    var t = d - ts.firstgid;
                    var y = Math.floor(t / ts.xspan); /* TODO: Vague feeling that x,y are redundant here. May be calculable in the Tile ctor if needed. */
                    var x = t - ts.xspan * y;

                    var xoverdraw = ts.tilewidth - map.tilewidth;
                    var yoverdraw = ts.tileheight - map.tileheight;

                    this.maxXOverdraw = Math.max(xoverdraw, this.maxXOverdraw);
                    this.maxYOverdraw = Math.max(yoverdraw, this.maxYOverdraw);

                    tileprops = undefined;
                    if (ts.tileproperties!==undefined && ts.tileproperties.hasOwnProperty(t)) {
                        tileprops = ts.tileproperties[t];
                    }

                    row.push(new Tile(
                            ts.image,
                            x * ts.tilewidth,
                            y * ts.tileheight,
                            ts.tilewidth,
                            ts.tileheight,
                            ts.tilewidth - map.tilewidth,
                            ts.tileheight - map.tileheight,
                            fixTypes(ts.properties),
                            fixTypes(tileprops)
                        ));
                }

                if (row.length>= l.width) {
                    l.rows.push(row);
                    this.rows = Math.max(this.rows, row.length);
                    row = [];
                }
            }
        }
    };

    /**
     * @method module:map/staggered-isometric.StaggeredIsometric#drawDebugRegions
     * @private
     */
    StaggeredIsometric.prototype.drawDebugRegions = function(ctx, props) {

        var map    = this.data;
        var l, layerEndY, layerEndX, r, x, y, stagger;

        var xstep  = map.tilewidth;
        var ystep  = map.tileheight / 2;

        var starty = Math.floor((this.yoffset-ystep) / ystep);
        var endy   = Math.floor((this.yoffset+this.clientHeight-ystep+this.maxYOverdraw) / ystep)+1;

        var startx = Math.floor((this.xoffset+this.clientWidth -1 ) / xstep);
        var endx   = Math.floor((this.xoffset-xstep/2-this.maxXOverdraw) / xstep);

        l = map.layers[0];

        layerEndY = Math.min(endy, l.rows.length-1);
        layerEndX = Math.max(endx, 0);

        var showRedGreen = false; /* Switch on here for odd/even region info */

        for (y = starty; y <= layerEndY; y++) {
            r = l.rows[y];
            var redgreen;
            if (y&1) {
                stagger = map.tilewidth/2;
                redgreen = '#f00';
            } else {
                stagger = 0;
                redgreen = '#0f0';
            }

            for (x = startx; x >= layerEndX; x--) {

                var rx = Math.floor(-this.xoffset) + stagger + x * xstep;
                var ry = Math.floor(-this.yoffset) + y * ystep;
                var rw = map.tilewidth;
                var rh = map.tileheight;

                if (showRedGreen) {
                    ctx.strokeStyle = redgreen;
                    ctx.strokeRect(rx, ry, rw, rh);
                }

                ctx.strokeStyle = '#aaa';
                ctx.beginPath();
                ctx.moveTo(rx, ry + rh/2);
                ctx.lineTo(rx+rw/2, ry);
                ctx.lineTo(rx+rw, ry+rh/2);
                ctx.lineTo(rx+rw/2, ry+rh);
                ctx.closePath();
                ctx.stroke();
            }
        }

        l = map.layers[0];

        for (y = 0; y < l.rows.length; y++) {
            r = l.rows[y];
            stagger = y&1?map.tilewidth/2:0;
            for (x = r.length-1; x >= 0; x--) {
                if (props.length>0) {
                    var valList = [];
                    var vals = this.getTilePropsAtTilePos(props, x, y);

                    for (var i = 0; i < props.length; i++) {
                        valList.push(vals[props[i]]);
                    }
                    debugText(ctx,
                            valList.join(),
                            85+Math.floor(-this.xoffset) + stagger + x * xstep,
                            55+Math.floor(-this.yoffset) + y * ystep);
                } else {
                    debugText(ctx,
                            x+","+y,
                            85+Math.floor(-this.xoffset) + stagger + x * xstep,
                            55+Math.floor(-this.yoffset) + y * ystep);
                }
            }
        }
    };

    /** Scrolls the map to the given world coordinate, limited to the set map
     * bounds.
     * @method module:map/staggered-isometric.StaggeredIsometric#scrollTo
     * @param  {Number} x The X world position to scroll to
     * @param  {Number} y The Y world position to scroll to
     */
    StaggeredIsometric.prototype.scrollTo = function(x, y) {
        this.xoffset=x;
        this.yoffset=y;

        if (this.xoffset < this.minxoffset) {
            this.xoffset = this.minxoffset;
        } else if (this.xoffset > this.maxxoffset) {
            this.xoffset = this.maxxoffset;
        }

        if (this.yoffset < this.minyoffset) {
            this.yoffset = this.minyoffset;
        } else if (this.yoffset > this.maxyoffset) {
            this.yoffset = this.maxyoffset;
        }
    };

    /** Scrolls the map by a given amound in pixels, limited to the set map
     * bounds.
     * @method module:map/staggered-isometric.StaggeredIsometric#scroll
     * @param  {Number} dx The X amount to scroll by
     * @param  {Number} dy The Y amount to scroll by
     */
    StaggeredIsometric.prototype.scroll = function(dx,dy) {
        this.scrollTo(this.xoffset+dx, this.yoffset+dy);
    };

    /** Gets an object describing the pixel limits of the world edges.
     * @method module:map/staggered-isometric.StaggeredIsometric#getWorldEdges
     * @return {Object} Contains 4 properties, le, te, re and be which hold
     * the left, top, right and bottom edges respectively.
     */
    StaggeredIsometric.prototype.getWorldEdges = function() {
        return {
            le:this.minxoffset,
            te:this.minyoffset,
            re:this.maxxoffset+this.clientWidth,
            be:this.maxyoffset+this.clientHeight
        };
    };

    /* TODO: We really need to remove the whole 'out' 2-length array thing. */

    /** Takes a world position and tells you what tile it lies on. Take
     * care with the return value, the function signature is all backwards.
     * @method module:map/staggered-isometric.StaggeredIsometric#worldToTilePos
     * @param {Number} x A world x position
     * @param {Number} y A world y position
     * @param {Array} out A 2-length array that will recieve the tile x/y
     * position in its 0/1 values.
     * @return {Number} The distance from the given world position to the
     * closest tile edge, capped at 127px. Not that this distance is screen distance,
     * in pixels.
     */
    StaggeredIsometric.prototype.worldToTilePos = function(x, y, out) {
        // http://gamedev.stackexchange.com/a/48507/3188

        var map = this.data; /* TODO: Why isn't 'data' called 'map' ? */

        var tw  = map.tilewidth;
        var th  = map.tileheight;

        x=x|0;
        y=y|0;

        var eventilex = Math.floor(x%tw);
        var eventiley = Math.floor(y%th);

        var dist = this.hitTest[eventilex + eventiley * tw];

        if (dist >= 128) {
            /* On even tile */

            out[0] = (((x + tw) / tw)|0) - 1;
            out[1] = 2 * ((((y + th) / th)|0) - 1);

            return dist-128;
        } else {
            /* On odd tile */

            out[0] = (((x + tw / 2) / tw)|0) - 1;
            out[1] = 2 * (((y + th / 2) / th)|0) - 1;

            return dist;
        }
    };

    /**
     * From a world position, this function determines the closest tile edge and
     * works out a vector pointing away from it.
     * @method module:map/staggered-isometric.StaggeredIsometric#worldEdgeNormal
     * @param {Number} x A world x position
     * @param {Number} y A world y position
     * @param {Array} out A 2-length array that will recieve the vector x/y
     * components in its 0/1 values.
     * @return {Number} The distance from the given world position to the
     * closest tile edge, capped at 127px. Note that this distance is given
     * in world-space, not screen space, to allow for the isometric
     * projection. This means that the distance will be different to the distance
     * returned from {@link module:map/staggered-isometric.StaggeredIsometric#worldEdgeNormal|worldToTilePos}
     */
    StaggeredIsometric.prototype.worldEdgeNormal = function(x, y, out) {
        var map = this.data; /* TODO: Why isn't 'data' called 'map' ? */

        var tw  = map.tilewidth;
        var th  = map.tileheight;

        x=x|0;
        y=y|0;

        var eventilex = Math.floor(x%tw);
        var eventiley = Math.floor(y%th);

        var testpos = eventilex + eventiley * tw;
        var dist = this.worldEdgeDistance[testpos];
        out[0] = this.edgeNormalsX[testpos];
        out[1] = this.edgeNormalsY[testpos];

        if (dist >= 128) {
            /* On even tile */
            return dist-128;
        } else {
            /* On odd tile */
            return dist;
        }
    };

    /** Takes a tile position and returns a property value as defined by the tiles.
     * Tiles are checked from the top-most layer down until a tile is found that
     * holds that property. This means that top-most tiles can override property
     * values from lower tiles.
     * @method module:map/staggered-isometric.StaggeredIsometric#getTilePropsAtTilePos
     * @param {String|Array} prop The property or properties to get.
     * @param {Number} x A tile x column position
     * @param {Number} y A tile y row position
     * @return {String|Array} The property value, or <code>undefined</code> if not found.
     * If the prop parameter was an array, the return value will be an object describing
     * all the properties required.
     */
    StaggeredIsometric.prototype.getTilePropsAtTilePos = function(prop, x, y) {
        var layers = this.data.layers;
        var propval;
        var resultset;
        var propset = typeof prop !== 'string';
        for (var i = layers.length - 1; i >= 0; i--) {
            var rows = layers[i].rows;
            if (rows!==undefined) {
                if (y>=0&&y<rows.length) {
                    var t = rows[y][x];
                    if (t) {
                        if (propset) {
                            var set = t.getProperties(prop);
                            if (resultset) {
                                setProps(set, resultset);
                            } else {
                                resultset = set;
                            }
                        } else {
                            propval = t.getProperty(prop);
                            if (propval!==undefined) {
                                return propval;
                            }
                        }
                    }
                }
            }
        }
        return propset?resultset:undefined;
    };

    /** Takes a tile position and sets a property value on the topmost tile at a
     * given tile position. If no tile is found, no property is set.
     * @method module:map/staggered-isometric.StaggeredIsometric#setTilePropAtTilePos
     * @param {String|Object} prop The property to set, or an object that contains
     * a set of properties to set on the tile.
     * @param {*} [val] The property value. Ignored if prop is an object.
     * @param {Number} x A tile x column position
     * @param {Number} y A tile y row position
     */
    StaggeredIsometric.prototype.setTilePropsAtTilePos = function(prop, val, x, y) {
        var layers = this.data.layers;
        var propval;
        for (var i = layers.length - 1; i >= 0; i--) {
            var rows = layers[i].rows;
            if (rows!==undefined) {
                if (y>=0&&y<rows.length) {
                    var t = rows[y][x];
                    if (t) {
                        if (typeof prop === 'string') {
                            t.setProperty(prop, val);
                        } else {
                            t.setProperties(prop);
                        }
                        return;
                    }
                }
            }
        }
    };

    /** Takes a world position and returns a property value as defined by the tiles
     * underneath that coordinate.
     * Tiles are checked from the top-most layer down until a tile is found that
     * holds that property. This means that top-most tiles can override property
     * values from lower tiles.
     * @method module:map/staggered-isometric.StaggeredIsometric#getTilePropsAtWorldPos
     * @param {String|Array} prop The property or properties to get
     * @param {Number} x A world x position
     * @param {Number} y A world y position
     * @return {String|Object} The property value, or <code>undefined</code> if not found.
     * If the prop parameter was an array, the return value will be an object describing
     * all the requested properties.
     */
    StaggeredIsometric.prototype.getTilePropsAtWorldPos = function(prop, x, y) {
        /*(void)*/this.worldToTilePos(x, y, xy);
        return this.getTilePropsAtTilePos(prop, xy[0], xy[1]);
    };

    /** Takes a screen position and tells you what tile it lies on. Take
     * care with the return value, the function signature is all backwards.
     * @method module:map/staggered-isometric.StaggeredIsometric#screenToTilePos
     * @param {Number} x A screen x position
     * @param {Number} y A screen y position
     * @param {Array} out A 2-length array that will recieve the tile x/y
     * position in its 0/1 values.
     * @return {Number} The distance from the given screen position to the
     * closest tile edge, capped at 127px. Not that this distance is screen distance,
     * in pixels.
     */
    StaggeredIsometric.prototype.screenToTilePos = function(x, y, out) {
        return this.worldToTilePos(x+this.xoffset, y+this.yoffset, out);
    };

    /** Convert a screen coordinate to a world coordinate.
     * @method module:map/staggered-isometric.StaggeredIsometric#screenToWorldPos
     * @param {Array} out Returned values via passed-in array. Must be 2-length.
     * Order is x,y
     */
    StaggeredIsometric.prototype.screenToWorldPos = function(x,y,out) {
        out[0] = x+this.xoffset;
        out[1] = y+this.yoffset;
    };


    /** Convert a world coordinate to a screen coordinate.
     * @method module:map/staggered-isometric.StaggeredIsometric#worldToScreenPos
     * @param {Array} out Returned values via passed-in array. Must be 2-length.
     * Order is x,y
     */
    StaggeredIsometric.prototype.worldToScreenPos = function(x, y, out) {
        out[0] = x-this.xoffset;
        out[1] = y-this.yoffset;
    };

    /** Inserts a new layer into the layer list.
     * @method module:map/staggered-isometric.StaggeredIsometric#insertLayer
     * @param {Number} idx The index to insert the layer at.
     * @param {Object} layer The layer to insert. Normally created via a
     * layer plugin.
     */
    StaggeredIsometric.prototype.insertLayer = function(idx, layer) {
        this.data.layers.splice(idx,0,layer);
    };

    /* TODO: Find all private marked functions and make sure they're actually private. */

    /**
     * @method module:map/staggered-isometric.StaggeredIsometric#updateLayers
     * @private
     */
    StaggeredIsometric.prototype.updateLayers = function(now) {
        var epoch = clock.now();
        var map   = this.data;
        for (var i = 0; i < map.layers.length; i++) {
            var l = map.layers[i];
            if (l.hasOwnProperty('update')) {
                l.update(now);
            }
        }
        this.stats.count('updateLayers', clock.now()-epoch);
    };

    /** Finds the index of the ground layer.
     * @method module:map/staggered-isometric.StaggeredIsometric#groundLayer
     * @return {Number} The index of the ground layer.
     */
    StaggeredIsometric.prototype.groundLayer = function() {
        var map = this.data;
        for (var i = 0; i < map.layers.length; i++) {
            var l = map.layers[i];

            if ('draw' in l || !l.visible) {
                continue;
            }

            return l;
        }

        return undefined;

    };

    /**
     * @method module:map/staggered-isometric.StaggeredIsometric#onResize
     * @private
     */
    StaggeredIsometric.prototype.onResize = function(w, h) {
        this.clientWidth  = w;
        this.clientHeight = h;

        this.maxxoffset   = this.data.width * this.data.tilewidth - this.clientWidth - 1;
        this.maxyoffset   = this.data.height * (this.data.tileheight/2) - this.clientHeight - 1;
    };


    /**
     * @method module:map/staggered-isometric.StaggeredIsometric#drawWorld
     * @private
     */
    StaggeredIsometric.prototype.drawWorld = function(ctx, now, sprites) {

        var map    = this.data;

        var epoch;

        var xstep  = map.tilewidth;
        var ystep  = map.tileheight / 2;

        var starty = Math.floor((this.yoffset-ystep) / ystep);
        var endy   = Math.floor((this.yoffset+this.clientHeight-ystep+this.maxYOverdraw) / ystep)+1;

        var startx = Math.floor((this.xoffset+this.clientWidth -1 ) / xstep);
        var endx   = Math.floor((this.xoffset-xstep/2-this.maxXOverdraw) / xstep);

        epoch = clock.now();
        /* Sort sprites first by y-axis, then by height, then creation order */
        /* TODO: Cull off-screen sprites first? */
        sprites.sort(function(a, b) {
            var n = a.y - b.y;
            if (n!==0) {
                return n;
            }
            n = a.h - b.h;
            return n!==0?n:a.nuid - b.nuid;
        });
        this.stats.count('spriteSort', clock.now()-epoch);


        epoch = clock.now();
        var spriteCursor = 0;
        var stagger = 0;
        var x, y, r, l, i, layerEndY, layerEndX;
        var top = map.layers.length-1;
        for (i = 0; i < map.layers.length; i++) {
            l = map.layers[i];
            var showBuildings = !this.hideBuildings||i!==top;

            if ('draw' in l) {
                l.draw(ctx, now);
                continue;
            }

            if (!l.visible) {
                continue;
            }

            layerEndY = Math.min(endy, l.rows.length-1);
            layerEndX = Math.max(endx, 0);

            for (y = starty; y <= layerEndY; y++) {
                r = l.rows[y];
                stagger = y&1?map.tilewidth/2:0;
                for (x = startx; x >= layerEndX; x--) {
                    var t = r[x];
                    if (t!==null&&showBuildings) {
                        t.draw(
                                ctx,
                                Math.floor(-this.xoffset) + stagger + x * xstep,
                                Math.floor(-this.yoffset) + y * ystep);
                    }
                }

                if (i===top) {
                    var z = (y+2) * ystep;
                    while(spriteCursor<sprites.length && z>=sprites[spriteCursor].y) {
                        sprites[spriteCursor++].draw(ctx, this.xoffset, this.yoffset, now);
                    }
                }
            }
        }
        this.stats.count('paintWorld', clock.now()-epoch);
    };

    return StaggeredIsometric;

});
