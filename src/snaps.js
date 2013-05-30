/*global define*/
define(['sprites/spritedef', 'sprites/sprite', 'sprites/composite',
        'input/keyboard', 'input/mouse',
        'util/all',
        'map/staggered-isometric',

        /* Plugins */
        'plugins/default-plugins',

        /* Tasks */
        'tasks/slowqueue',

        /* Animation */
        'animate/tween',

        /* AI */
        'ai/proximity-tracker',
        'ai/pathfinder',

        /* Testing */
        'polyfills/requestAnimationFrame',

        /* Non-referenced */
        'polyfills/bind'],

function(SpriteDef, Sprite, Composite, Keyboard, Mouse, util, StaggeredIsometric,
        regPlugins,
        SlowQueue,
        tweens,
        ProximityTracker, PathFinder,
        overrideClock) {

    /*
     * TODO: https://github.com/izb/snaps.js/wiki/Todo
     */

    'use strict';


    /**
     * @module snaps
     */

    var debugText = util.debug.debugText;
    var copyProps = util.js.copyProps;
    var clone     = util.js.clone;
    var Preloader = util.Preloader;
    var MinHeap   = util.MinHeap;
    var uid       = util.uid;
    var Stats     = util.Stats;
    var clock     = util.clock;

    /**
     * The main class of the game engine
     * @constructor module:snaps.Snaps
     * @param {Object} game A game object
     * @param {String} canvasID The ID of a canvas on the page to render into
     * @param {Object} [settings] Assorted settings to control the engine behavior.
     */
    function Snaps(game, canvasID, settings) {

        /* TODO: Docs - document settings object options */

        var _this = this;

        /* For testing, we'd like to perhaps re-bind this function later, so... */
        this.requestAnimationFrame = window.requestAnimationFrame.bind(window);

        /* Make some functionality directly available to the game via the engine ref */

        /**
         * The contents of the util/* modules are exposed here for general use.
         * @member module:snaps.Snaps#util
         * @type {Object}
         */
        this.util = util;

        /**
         * The contents of the animate/tween module is exposed here for general use.
         * @member module:snaps.Snaps#tweens
         * @type {Object}
         */
        this.tweens = tweens;

        /**
         * The MinHeap constructor is exposed here for general use.
         * @member module:snaps.Snaps#MinHeap
         * @type {Function}
         */
        this.MinHeap = MinHeap;

        /**
         * The Stats constructor is exposed here for general use. To access standard running stats you
         * probably want {@link module:snaps.Snaps#stats|stats} instead.
         * @member module:snaps.Snaps#Stats
         * @type {Function}
         */
        this.Stats = Stats;

        /**
         * The ProximityTracker constructor is exposed here for general use.
         * @member module:snaps.Snaps#ProximityTracker
         * @type {Function}
         */
        this.ProximityTracker = ProximityTracker.bind(ProximityTracker, this);

        /**
         * The PathFinder constructor is exposed here for general use.
         * @member module:snaps.Snaps#PathFinder
         * @type {Function}
         */
        this.PathFinder = PathFinder.bind(PathFinder, this);

        settings = settings || {};
        this.dbgShowMouse     = !!settings.showMouse;
        this.dbgShowCounts    = !!settings.showCounts;
        this.dbgShowMouseTile = !!settings.showMouseTile;
        /* If regions is true, then the x,y is shown for tiles. If it's a comma-separated list
         * then those property values are shown on each tile. */
        this.dbgShowRegions   = !!settings.showRegions;
        this.dbgRegionProps   = settings.showRegions&&settings.showRegions.length>0&&settings.showRegions!=='true'?
            settings.showRegions.split(','):[];

        this.imageCache     = {};
        this.spriteUpdaters = {};
        this.colliders      = {};
        this.fxUpdaters     = {};
        this.layerPlugins   = {};
        this.cameraPlugins  = {};
        this.phaserPlugins  = {};

        /**
         * Exposes some standard running stats
         * @member module:snaps.Snaps#stats
         * @type {Object}
         */
        this.stats = new Stats();

        this.timers     = {};
        this.cameras    = {};
        this.camera     = null;

        this.activeFX   = [];

        this.taskQueues = [];

        this.now   = 0;
        this.epoch = 0; /* 0 in chrome, but moz passes unix time. Epoch will be adjusted on first repaint */

        var c = document.getElementById(canvasID);
        this.clientWidth  = c.clientWidth;
        this.clientHeight = c.clientHeight;
        this.ctx          = c.getContext("2d");

        this.keyboard = new Keyboard();
        this.mouse    = new Mouse(c);

        this.ctx.fillStyle='#000022';
        this.ctx.fillRect (0,0,c.clientWidth,c.clientHeight);

        this.game = game;
        if (game.map!==undefined) {
            if (typeof game.hitTests !== 'object' || game.hitTests.hit===undefined) {
                throw "Game must define a hitTests object with at least a 'hit' property";
            }

            /* Obviously we're assuming it's always a staggered isometric map.
             * We don't yet support anything else. */
            this.map = new StaggeredIsometric(game.map, game.hitTests, this.clientWidth, this.clientHeight, this.stats);
            this.map.hideBuildings = !!settings.hideBuildings;
        }

        var draw   = _this.game.draw;
        var update = _this.game.update;

        this.spriteDefs = {};
        this.sprites    = [];
        this.phasers    = [];
        this.spriteMap  = {};

        this.lastFrameTime = 0;

        /**
         * Registers a new updater plugin. See other plugin code for an example of how
         * to call this.
         * @method module:snaps.Snaps#registerSpriteUpdater
         * @param  {String} name The name of the plugin.
         * @param  {Function} ctor The constructor of the sprite updater object.
         */
        this.registerSpriteUpdater = function(name, ctor) {
            _this.spriteUpdaters[name] = ctor;
        };

        /**
         * Registers a new effect plugin. See other plugin code for an example of how
         * to call this.
         * @method module:snaps.Snaps#registerFxPlugin
         * @param  {String} name The name of the plugin.
         * @param  {Function} fn The constructor of the fx updater object.
         */
        this.registerFxPlugin = function(name, fn) {
            _this.fxUpdaters[name] = fn;
        };

        /**
         * Registers a new layer plugin. See other plugin code for an example of how
         * to call this.
         * @method module:snaps.Snaps#registerLayerPlugin
         * @param  {String} name The name of the plugin.
         * @param  {Function} fn The constructor of the layer updater object.
         */
        this.registerLayerPlugin = function(name, fn) {
            _this.layerPlugins[name] = fn;
        };

        /**
         * Registers a new collider plugin. See other plugin code for an example of how
         * to call this.
         * @method module:snaps.Snaps#registerColliderPlugin
         * @param  {String} name The name of the plugin.
         * @param  {Function} fn The constructor of the collider object.
         */
        this.registerColliderPlugin = function(name, fn) {
            _this.colliders[name] = fn;
        };

        /**
         * Registers a new camera plugin. See other plugin code for an example of how
         * to call this.
         * @method module:snaps.Snaps#registerCameraPlugin
         * @param  {String} name The name of the plugin.
         * @param  {Function} fn The constructor of the camera object.
         */
        this.registerCameraPlugin = function(name, fn) {
            _this.cameraPlugins[name] = fn;
        };

        /**
         * Registers a new phaser plugin. See other plugin code for an example of how
         * to call this.
         * @method module:snaps.Snaps#registerPhaserPlugin
         * @param  {String} name The name of the plugin.
         * @param  {Function} fn The constructor of the phaser object.
         */
        this.registerPhaserPlugin = function(name, fn) {
            _this.phaserPlugins[name] = fn;
        };

        /* Register the default plugins */
        regPlugins(this);

        if (typeof _this.game.onEngineStart === 'function') {
            _this.game.onEngineStart(this);
        }

        var preloader = new Preloader();

        if (this.map!==undefined) {
            this.map.primePreloader(preloader);
        }

        /* Add game-added images to the preloader */
        if (typeof game.preloadImages === 'object') {

            var storePreloaded = function(image, tag){
                _this.imageCache[tag] = image;
            };

            for(var pathName in game.preloadImages) {
                preloader.add(game.preloadImages[pathName], pathName, storePreloaded);
            }
        }

        /* Add sprites to the preloader */
        if (typeof _this.game.spriteDefs === 'object') {

            var storeSpriteSheet = function(image, tag){

                var state;

                var data = _this.game.spriteDefs[tag];
                var sd = new SpriteDef(image, data.w, data.h, data.x, data.y);
                _this.spriteDefs[tag] = sd;

                for (state in data.states) {
                    if (typeof(data.states[state])==='object') {
                        sd.addState(state, data.states[state].seq, data.states[state].dur);
                    }

                    if (typeof(data.states[state])==='number') {
                        sd.addState(state, [data.states[state]], 1000);
                    }
                }

                for (state in data.states) {
                    if (typeof(data.states[state])==='string') {
                        sd.aliasState(state, data.states[state]);
                    }
                }
            };

            for(var spriteName in _this.game.spriteDefs) {
                preloader.add(_this.game.spriteDefs[spriteName].path, spriteName, storeSpriteSheet);
            }
        }

        /**
         * If your game object exposes a <code>preloadImages</code> property, then those images
         * will be preloaded by the engine along with the map images. Call this method to draw
         * the image by name, e.g.
         * <pre>
         * game.preloadImages = {
         *     logo: 'mylogo.png'
         * }
         * //...
         * sn.drawImage('logo', 50, 30);
         * </pre>
         * @method module:snaps.Snaps#drawImage
         * @param  {String} im The image name
         * @param  {Number} x  The screen x position
         * @param  {Number} y  The screen y position
         */
        this.drawImage = function(im, x, y) {
            _this.ctx.drawImage(_this.imageCache[im],x,y);
        };

        /**
         * Clears the screen. Normally you don't need to do this if your map has no holes
         * in it since the screen will be redrawn from corner to corner.
         * @method module:snaps.Snaps#cls
         * @param  {String} [col] The screen clearing color as a CSS color spec. Defaults to black.
         */
        this.cls = function(col) {
            _this.ctx.fillStyle = col||'#000';
            _this.ctx.fillRect (0,0,_this.clientWidth,_this.clientHeight);
        };

        /**
         * Call this to bind keys to actions which you can test later on with
         * the {@link module:snaps.Snaps#actioning|actioning} method.
         * <pre>
         * sn.bindKeys([
         *     {key:'left',  action:'left'},
         *     {key:'right', action:'right'},
         *     {key:'up',    action:'up'},
         *     {key:'down',  action:'down'},
         *
         *     // alternatives
         *     {key:'w', action:'up'},
         *     {key:'a', action:'left'},
         *     {key:'s', action:'down'},
         *     {key:'d', action:'right'}
         * ]);
         * </pre>
         * @method module:snaps.Snaps#bindKeys
         * @param  {Array} keybinds An array of objects exposing key and action
         * properties. See the description for an example.
         */
        this.bindKeys = function(keybinds) {
            for (var i = 0; i < keybinds.length; i++) {
                var keybind = keybinds[i];
                _this.keyboard.bind(keybind.key, keybind.action);
            }
        };

        /**
         * @method module:snaps.Snaps#updateTasks
         * @private
         */
        this.updateTasks = function() {
            var epoch = clock.now();
            for (var i = _this.taskQueues.length - 1; i >= 0; i--) {
                _this.taskQueues[i].run();
            }
            this.stats.count('updateTasks', clock.now()-epoch);
        };

        /**
         * @method module:snaps.Snaps#updatePhasers
         * @private
         */
        this.updatePhasers = function() {
            var epoch = clock.now();
            for (var i = _this.phasers.length - 1; i >= 0; i--) {
                _this.phasers[i].rebalance(_this.now);
            }
            this.stats.count('updatePhasers', clock.now()-epoch);
        };

        /**
         * @method module:snaps.Snaps#updateFX
         * @private
         */
        this.updateFX = function() {
            var epoch = clock.now();
            for (var i = _this.activeFX.length - 1; i >= 0; i--) {
                var fx = _this.activeFX[i];
                if (!fx.update(_this.now)) {
                    _this.activeFX.splice(i, 1);
                }
            }
            this.stats.count('updateFX', clock.now()-epoch);
        };

        /**
         * Spawn a new fx instance
         * @method module:snaps.Snaps#fx
         * @param  {Number} name The fx plugin to instantiate
         * @param  {Object} [opts] Options to pass to the plugin
         */
        this.fx = function(name, opts) {
            if (!_this.fxUpdaters.hasOwnProperty(name)) {
                throw "Can't create FX for unregistered FX type: " + name;
            }
            _this.activeFX.push(new _this.fxUpdaters[name](opts));
        };

        /**
         * Insert a new layer
         * @method module:snaps.Snaps#addLayer
         * @param  {String} name A unique name for the new layer
         * @param  {String} type The layer plugin to instantiate
         * @param  {Object} [opts] Options to pass to the plugin
         * @param  {Number} idx The layer index to insert it at
         */
        this.addLayer = function(name, type, opts, idx) {
            /* TODO: name must be unique. */
            /* TODO: Instead of index, we should say which layer to insert after or before, e.g.
             * 'after ground' */

            opts = opts||{};

            if (!_this.layerPlugins.hasOwnProperty(type)) {
                throw "Can't create layer for unregistered layer type: " + type;
            }
            var layer = new _this.layerPlugins[type](name, opts);
            _this.map.insertLayer(idx, layer);
            return layer;
        };

        /**
         * Count the sprites on the stage, including those in composites
         * @method module:snaps.Snaps#spriteCount
         * @return  {Number} The number of sprites on the stage.
         */
        this.spriteCount = function() {
            var c = 0;
            for (var i = 0; i < _this.sprites.length; i++) {
                var s = _this.sprites[i];
                if (s instanceof Composite) {
                    c+=s.sprites.length;
                } else {
                    c++;
                }
            }
            return c;
        };

        function drawDebug() {

            if (_this.dbgShowMouse) {
                debugText(_this.ctx,
                        "Screen: "+_this.mouse.x+","+_this.mouse.y,5, 15);
                debugText(_this.ctx,
                        "World: "+(_this.mouse.x+_this.map.xoffset)+","+(_this.mouse.y+_this.map.yoffset), 5, 30);
                debugText(_this.ctx,
                        "Origin: "+(_this.map.xoffset)+","+(_this.map.yoffset), 5, 45);
            }

            if (_this.dbgShowCounts) {
                debugText(_this.ctx,
                        "Sprites: "+_this.spriteCount(),5, _this.clientHeight-15);
            }

            if (_this.dbgShowMouseTile && _this.map!==undefined) {
                var worldPos = [0,0];
                _this.mouseWorldPos(worldPos);
                var tilePos = [0,0];
                _this.worldToTilePos(worldPos[0], worldPos[1], tilePos);
                debugText(_this.ctx,
                        "Mouse in tile: "+tilePos[0]+", "+tilePos[1],5, _this.clientHeight-30);
            }
        }

        this.halt = function() {
            _this.halt = true;
        };

        function loop(now) {
            if (now>315532800 && _this.epoch===0) {
                /* Hack due to differences between moz and chrome implementations of
                 * requestAnimationFrame. If time is > 10 years, we decide that this must be
                 * firefox, and adjust our epoch and all timings henceforth. */
                _this.epoch = now - 16; /* 1/60s, just because. */
            }

            now = now - _this.epoch;
            _this.now = now;

            _this.requestAnimationFrame(loop);

            _this.updateTasks();
            _this.updateFX();
            _this.map.updateLayers(now);
            _this.updatePhasers();
            update(now - _this.lastFrameTime); /* This fn is in the game code */
            _this.updateSprites();
            if (_this.camera) {
                _this.camera.update(now);
            }
            draw(_this.ctx); /* This fn is also in the game code */
            if (_this.dbgShowRegions && _this.map!==undefined) {
                _this.map.drawDebugRegions(_this.ctx, _this.dbgRegionProps);
            }

            drawDebug();

            _this.lastFrameTime = _this.now;
        }

        preloader.load(

            /* Preloading complete */
            function() {

                /* Resolve the layers into handy image references */
                if (_this.map!==undefined) {
                    _this.map.resolveTiles();
                }

                /* Tell the game where we're at */
                if (typeof _this.game.onResourcesLoaded === 'function') {
                    _this.game.onResourcesLoaded();
                }

                /* Start the paint loop */
                _this.halt = false;
                _this.overrideClock();
                setTimeout(function(){loop(0);}, 0);
            },

            /* Preloader progress */
            function(progress) {
                if (typeof _this.game.onProgress === 'function') {
                    _this.game.onProgress(progress, _this.ctx);
                }
            },

            /* Preloading failed */
            function() {
                if (typeof _this.game.onLoadError === 'function') {
                    _this.game.onLoadError();
                }
            }
        );

        /**
         * Test the keyboard to see if the user has pressed any bound keys
         * @method module:snaps.Snaps#actioning
         * @param  {String} action The name of the action to test
         * @return {Boolean} True if pressed.
         */
        this.actioning = function(action) {
            return _this.keyboard.actionPressed(action);
        };

        /* TODO: Rename scroll methods to better reflect the fact that it sets
         * the map position rather than animatedly scroll it. */

        /**
         * Scroll the map view by a given amount of pixels.
         * @method module:snaps.Snaps#scroll
         * @param  {Number} dx The number of pixels to scroll horizontally
         * @param  {Number} dy The number of pixels to scroll vertically
         */
        this.scroll = function(dx,dy) {
            _this.map.scroll(dx, dy);
        };

        /**
         * Sets the map position to center on a given world coordinate.
         * @method module:snaps.Snaps#scrollTo
         * @param  {Number} x The x position of the new map center.
         * @param  {Number} y The y position of the new map center.
         */
        this.scrollTo = function(x,y) {
            _this.map.scrollTo(x, y);
        };

        /** Gets an object describing the pixel limits of the world edges.
         * @method module:snaps.Snaps#getWorldEdges
         * @return {Object} Contains 4 properties, le, te, re and be which hold
         * the left, top, right and bottom edges respectively.
         */
        this.getWorldEdges = function() {
            return _this.map.getWorldEdges();
        };

        /** Call from your game draw function to draw the map, sprites, layers, fx etc
         * @method module:snaps.Snaps#drawWorld
         */
        this.drawWorld = function() {
            this.map.drawWorld(_this.ctx, _this.now, _this.sprites);
        };

        /** Get the mouse screen position
         * @method module:snaps.Snaps#mouseScreenPos
         * @param {Array} out An 2-length array that will recieve the xy values of
         * the mouse position in that order.
         */
        this.mouseScreenPos = function(out) {
            out[0] = _this.mouse.x;
            out[1] = _this.mouse.y;
        };

        /** Get the mouse world position
         * @method module:snaps.Snaps#mouseWorldPos
         * @param {Array} out An 2-length array that will recieve the xy values of
         * the mouse position in that order.
         */
        this.mouseWorldPos = function(out) {
            _this.map.screenToWorldPos(_this.mouse.x, _this.mouse.y, out);
        };

        /** Takes a world position and tells you what tile it lies on. Take
         * care with the return value, the function signature is all backwards.
         * @method module:snaps.Snaps#worldToTilePos
         * @param {Number} x A world x position
         * @param {Number} y A world y position
         * @param {Array} out A 2-length array that will recieve the tile x/y
         * position in its 0/1 values.
         * @return {Number} The distance from the given world position to the
         * closest tile edge, capped at 127px.
         */
        this.worldToTilePos = function(x, y, out) {
            return this.map.worldToTilePos(x,y, out);
        };

        /** Takes a screen position and tells you what tile it lies on. Take
         * care with the return value, the function signature is all backwards.
         * @method module:snaps.Snaps#screenToTilePos
         * @param {Number} x A screen x position
         * @param {Number} y A screen y position
         * @param {Array} out A 2-length array that will recieve the tile x/y
         * position in its 0/1 values.
         * @return {Number} The distance from the given screen position to the
         * closest tile edge, capped at 127px.
         */
        this.screenToTilePos = function(x, y, out) {
            return this.map.screenToTilePos(x,y, out);
        };

        /** Convert a screen position to a world position
         * @method module:snaps.Snaps#screenToWorldPos
         * @param {Array} out An 2-length array that will recieve the xy values of
         * the position in that order.
         */
        this.screenToWorldPos = function(x, y, out) {
            this.map.screenToWorldPos(x,y, out);
        };

        /** Convert a world position to a screen position
         * @method module:snaps.Snaps#worldToScreenPos
         * @param {Array} out An 2-length array that will recieve the xy values of
         * the position in that order.
         */
        this.worldToScreenPos = function(x, y, out) {
            this.map.worldToScreenPos(x,y, out);
        };

        /** Get a tile by it's row and column position in the original map data.
         * @method module:snaps.Snaps#getTile
         * @param  {Object} layer The layer to search for tiles.
         * @param  {Number} c The column, aka x position in the data.
         * @param  {Number} r the row, aka y position in the data.
         * @return {Object} A {@link  module:map/tile.Tile|Tile}, or null if the input was out of range.
         */
        this.getTile = function(layer, c, r) {
            return this.map.getTile(layer, c, r);
        };

        /** Get a tile by it's row and column position and find the world position
         * of its center point.
         * @method module:snaps.Snaps#getTileWorldPos
         * @param  {Number} c The column, aka x position in the data.
         * @param  {Number} r the row, aka y position in the data.
         * @return {Object} A tile, or null if the input was out of range.
         */
        this.getTileWorldPos = function(c, r, out) {
            this.map.tileDimensions(out);
            if ((r&1)===0) {
                out[0] = (c+1)*out[0] - (out[0]/2);
                out[1] = (r+1)*(out[1]/2);
            } else {
                out[0] = (c+1)*out[0];
                out[1] = (r+1)*(out[1]/2);
            }
        };

        /** Get a tile property from a world position. Starts at the topmost
         * map layer and world down to the ground.
         * @method module:snaps.Snaps#getTilePropsAtWorldPos
         * @param {String|Array} prop The property or properties to get.
         * @param  {Number} x The x world position
         * @param  {Number} y The y world position
         * @return {String|Array} The property value, or <code>undefined</code> if not found.
         * If the prop parameter was an array, the return value will be an object describing
         * all the properties required.
         */
        this.getTilePropsAtWorldPos = function(prop, x, y) {
            return this.map.getTilePropsAtWorldPos(prop, x,y);
        };

        /** Sets multiple properties on the topmost tile at a given tile position.
         * @method module:snaps.Snaps#getTilePropsAtWorldPos
         * @param {Object} props An object containing all the properties
         * to copy into the tile's properties.
         * @param  {Number} x The x tile column position
         * @param  {Number} y The y tile row position
         */
        this.setTilePropsAtTilePos = function(props, x, y) {
            this.map.setTilePropsAtTilePos(props, undefined, x,y);
        };

        /** Get a tile property from a tile column and row in the original map data.
         * Starts at the topmost map layer and world down to the ground.
         * @method module:snaps.Snaps#getTilePropsAtTilePos
         * @param  {String} prop The property to get
         * @param  {Number} x The x tile column position
         * @param  {Number} y The y tile row position
         * @return {String} The property or undefined.
         */
        this.getTilePropsAtTilePos = function(prop, x, y) {
            return this.map.getTilePropsAtTilePos(prop, x,y);
        };

        /**
         * Create a new collider for use in sprites.
         * @method module:snaps.Snaps#createCollider
         * @param  {String} type The name of the collider plugin
         * @param  {Object} opts Options to pass to the collider
         * @return {Object} A collider
         */
        this.createCollider = function(type, opts) {
            if(!_this.colliders.hasOwnProperty(type)) {
                throw "Warning: undefined collider plugin: " + type;
            }
            return new _this.colliders[type](opts);
        };

        /**
         * Adds a new task queue. You can add task objects to this queue. Tasks are
         * run in a time-contrained prioritised way in the game loop.
         * @method module:snaps.Snaps#createTaskQueue
         * @param  {Number} maxFrameTime The maximum time permitted for this queue to
         * run in during each frame.
         * @return {Object} A {@link module:util/slowqueue#SlowQueue|queue object}.
         */
        this.createTaskQueue = function(maxFrameTime) {
            var q = new SlowQueue(maxFrameTime);
            this.taskQueues.push(q);
            return q;
        };

        /**
         * Create a new camera for use in game. Creating a camera does not
         * activate it. You need to then call {@link module:snaps.Snaps#switchToCamera|switchToCamera}.
         * @method module:snaps.Snaps#createCamera
         * @param  {String} name The name of the camera so that you can refer
         * to it again.
         * @param  {String} type The name of the camera plugin to instantiate.
         * @param  {Object} opts Options to pass to the camera
         * @return {Object} The new camera.
         */
        this.createCamera = function(name, type, opts) {
            if(!_this.cameraPlugins.hasOwnProperty(type)) {
                throw "Warning: undefined camera plugin: " + type;
            }

            if (this.cameras.hasOwnProperty(name)) {
                throw "Camera already exists: "+name;
            }

            this.cameras[name] = new _this.cameraPlugins[type](opts);
            return this.cameras[name];
        };

        /**
         * Switch to a previously created, named camera
         * @method module:snaps.Snaps#switchToCamera
         * @param  {String} name The name of the camera
         */
        this.switchToCamera = function(name) {
            this.camera = this.cameras[name];
        };

        /**
         * Spawn a new sprite in the world
         * @method module:snaps.Snaps#spawnSprite
         * @param {String} defName The name of the sprite definition to use. These are
         * set up in your game's spriteDefs data.
         * @param {String} stateName The initial state. This too is defined in the
         * sprite's definition, in your game's spriteDefs data.
         * @param {Number} x The world x coordinate. Can be a function which takes
         * no parameters and returns a number.
         * @param {Number} y The world y coordinate. Can be a function which takes
         * no parameters and returns a number.
         * @param {Number} h The height off the ground. Can be a function which takes
         * no parameters and returns a number.
         * @param {Object} [opts] Optional sprite parameters. For a list of parameters
         * see the opts parameter on the {@link module:sprites/sprite.Sprite|Sprite class constructor}.
         */
        this.spawnSprite = function(defName, stateName, stateExt, x, y, h, opts) {

            opts = opts||{};

            if (opts.id===undefined) {
                opts.id = uid();
            } else {
                if(_this.spriteMap.hasOwnProperty(opts.id)) {
                    throw "Error: duplicate sprite id " + opts.id;
                }
            }

            var s = Sprite.construct(_this, defName, stateName, stateExt, x, y, h, opts);

            _this.sprites.push(s);
            _this.spriteMap[opts.id] = s;

            return s;
        };

        /**
         * Spawn a new composite in the world
         * @method module:snaps.Snaps#createComposite
         * @param {Number} x The world x coordinate.
         * @param {Number} y The world y coordinate.
         * @param {String} id A unique ID so you can find the composite again.
         * @param {Object} [endCallback] Once the composite and all its child sprites expire,
         * this is called.
         */
        this.createComposite = function(x,y,id,endCallback) {

            if (id===undefined) {
                id = 'id'+uid();
            } else {
                if(_this.spriteMap.hasOwnProperty(id)) {
                    throw "Warning: duplicate sprite (composite) id " + id;
                }
            }

            var comp = new Composite(this, x, y, id, endCallback);
            comp.init();
            _this.sprites.push(comp);
            _this.spriteMap[id] = comp;
            return comp;
        };

        /** Marks a time in the future for a timer to trigger. Timers are
         * not events driven by the engine, but rather need to be explicitely
         * checked in a timely fashion by the game, via {@link module:snaps.Snaps#markTime|checkTimer}.
         * @method module:snaps.Snaps#markTime
         * @param {String} name A name for the timer. Use this to check the timer later.
         * @param {Number} time When to set the timer for in ms. E.g. 1000 == 1s in the future.
         */
        this.markTime = function(name, time) {
            _this.timers[name] = _this.now + time;
        };

        /** Checks to see if a timer set with markTime has passed.
         * @method module:snaps.Snaps#checkTimer
         * @param {String} name The name of the timer to check.
         * @param {Number} [resetMs] If omitted, the timer will be removed. If
         * present, the timer will be reset, adding resetMs to its current
         * expired trigger time.
         * @return {Boolean} true if the timer has triggered. Note that an immediate
         * call to checkTimer again will return false - The true value is
         * only returned once unless the timer is reset.
         */
        this.checkTimer = function(name, resetMs) {
            if (_this.timers[name]===undefined) {
                /* This timer has already returned true and been deleted. They only work once. */
                return false;
            }
            var mark = _this.timers[name];
            var dt = _this.now - mark;
            if (dt>0) {
                if (resetMs===undefined) {
                    delete _this.timers[name];
                } else {
                    resetMs = Math.max(1, resetMs);
                    do {
                        mark+=resetMs;
                    }while(mark<_this.now);
                    _this.timers[name] = mark;
                }
                return true;
            }
            return false;
        };

        /** Find a sprite on the stage by ID
         * @method module:snaps.Snaps#sprite
         * @param {String} sprite The name of the sprite to get.
         * @return {Object} A sprite, or undefined
         */
        this.sprite = function(sprite) {
            return _this.spriteMap[sprite];
        };

        /**
         * @method module:snaps.Snaps#updateSprites
         * @private
         */
        this.updateSprites = function() {
            var epoch = clock.now();
            var keepsprites = [];
            var i, s;
            for ( i = _this.sprites.length - 1; i >= 0; i--) {
            //     _this.sprites[i]
            // }
            // for (i = 0; i < _this.sprites.length; i++) {
                s = _this.sprites[i];
                if (s.isActive(_this.now)) {
                    s.update(_this.now);
                    keepsprites.push(s);
                } else {
                    s.onRemove();
                    delete _this.spriteMap[s.name];
                }
            }
            _this.sprites = keepsprites;

            for (i = 0; i < _this.sprites.length; i++) {
                s = _this.sprites[i];
                s.commit(_this.now);
            }
            this.stats.count('updateSprites', clock.now()-epoch);
        };

        /**
         * The current frame time, updated at the start of each loop
         * @method module:snaps.Snaps#getNow
         * @return {Number} The current frame time.
         */
        this.getNow = function() {
            return _this.now;
        };

        /**
         * Overrides the clock in order to create predictable frame timings in
         * unit tests.
         * @method module:snaps.Snaps#overrideClock
         * @private
         */
        this.overrideClock = function() {
            overrideClock();
        };

        /**
         * Spawn a new phaser for use in sprite updates
         * @method module:snaps.Snaps#createPhaser
         * @param {String} name The name of the phaser plugin to instantiate.
         * @param {Object} [opts] Optional values passed to the phaser.
         */
        this.createPhaser = function(name, opts) {
            if (!_this.phaserPlugins.hasOwnProperty(name)) {
                throw "Can't create phaser for unregistered type: " + name;
            }

            var phaser = new _this.phaserPlugins[name]('id'+uid(), opts);
            _this.phasers.push(phaser);
            return phaser;
        };

        /**
         * Call this when the canvas is resized in the browser.
         * @method module:snaps.Snaps#resizeCanvas
         */
        this.resizeCanvas = function() {

            var c = document.getElementById(canvasID);
            this.clientWidth = c.clientWidth;
            this.clientHeight = c.clientHeight;

            _this.map.onResize(c.clientWidth, c.clientHeight);
        };
    }

    /**
     * The contents of the util/* modules are exposed here for general use.
     * @member module:snaps.Snaps#util
     * @type {Object}
     */
    Snaps.util = util;

    return Snaps;
});
