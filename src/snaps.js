/*global define*/
define(['sprites/spritedef', 'sprites/sprite', 'sprites/composite',
        'input/keyboard', 'input/mouse',
        'util/all',
        'map/staggered-isometric',

        /* Plugins */
        'plugins/default-plugins',

        /* Animation */
        'animate/tween',

        /* AI */
        'ai/proximity-tracker',
        'ai/pathfinder',

        /* Non-referenced */
        'polyfills/requestAnimationFrame', 'polyfills/bind'],

function(SpriteDef, Sprite, Composite, Keyboard, Mouse, util, StaggeredIsometric,
        regPlugins,
        tweens,
        ProximityTracker, PathFinder) {

    /*
     * TODO: https://github.com/izb/snaps.js/wiki/Todo
     */

    'use strict';

    var debugText = util.debug.debugText;
    var copyProps = util.js.copyProps;
    var clone     = util.js.clone;
    var Preloader = util.Preloader;
    var MinHeap   = util.MinHeap;
    var uid       = util.uid;
    var Stats     = util.Stats;

    function Snaps(game, canvasID, settings) {

        var _this = this;

        /* For testing, we'd like to perhaps re-bind this function later, so... */
        this.requestAnimationFrame = window.requestAnimationFrame.bind(window);

        /* Make some functionality directly available to the game via the engine ref */
        this.util = util;
        this.tweens = tweens;
        this.MinHeap = MinHeap;
        this.Stats = Stats;
        this.ProximityTracker = ProximityTracker.bind(ProximityTracker, this);
        this.PathFinder = PathFinder.bind(PathFinder, this);

        settings = settings || {};
        this.dbgShowMouse     = !!settings.showMouse;
        this.dbgShowCounts    = !!settings.showCounts;
        this.dbgShowRegions   = !!settings.showRegions;
        this.dbgShowMouseTile = !!settings.showMouseTile;

        this.imageCache = {};

        this.spriteUpdaters = {};
        this.colliders = {};
        this.fxUpdaters = {};
        this.layerPlugins = {};
        this.cameraPlugins = {};
        this.phaserPlugins = {};

        this.stats = new Stats();

        this.timers = {};
        this.cameras = {};
        this.camera = null;

        this.activeFX = [];

        this.now = 0;
        this.epoch = 0; /* 0 in chrome, but moz passes unix time. Epoch will be adjusted on first repaint */

        var c = document.getElementById(canvasID);
        this.clientWidth = c.clientWidth;
        this.clientHeight = c.clientHeight;
        this.ctx = c.getContext("2d");

        this.keyboard = new Keyboard();
        this.mouse = new Mouse(c);

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

        var draw = _this.game.draw;
        var update = _this.game.update;

        this.spriteDefs = {};
        this.sprites = [];
        this.phasers = [];
        this.spriteMap = {};

        this.lastFrameTime = 0;

        this.registerSpriteUpdater = function(name, ctor) {
            _this.spriteUpdaters[name] = ctor;
        };

        this.registerFxPlugin = function(name, fn) {
            _this.fxUpdaters[name] = fn;
        };

        this.registerLayerPlugin = function(name, fn, init) {
            init.call(this);
            _this.layerPlugins[name] = fn;
        };

        this.registerColliderPlugin = function(name, fn, init) {
            _this.colliders[name] = {fn:fn, init:init};
        };

        this.registerCameraPlugin = function(name, fn, init) {
            _this.cameraPlugins[name] = {fn:fn, init:init};
        };

        this.registerPhaserPlugin = function(name, fn) {
            _this.phaserPlugins[name] = {fn:fn};
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

        this.drawImage = function(im, x, y) {
            _this.ctx.drawImage(_this.imageCache[im],x,y);
        };

        this.cls = function(col) {
            _this.ctx.fillStyle = col||'#000';
            _this.ctx.fillRect (0,0,_this.clientWidth,_this.clientHeight);
        };

        this.bindKeys = function(keybinds) {
            for (var i = 0; i < keybinds.length; i++) {
                var keybind = keybinds[i];
                _this.keyboard.bind(keybind.key, keybind.action);
            }
        };

        this.updatePhasers = function() {
            var epoch = +new Date();
            for (var i = _this.phasers.length - 1; i >= 0; i--) {
                _this.phasers[i].rebalance(_this.now);
            }
            this.stats.count('updatePhasers', (+new Date())-epoch);
        };

        this.updateFX = function() {
            var epoch = +new Date();
            for (var i = _this.activeFX.length - 1; i >= 0; i--) {
                var fx = _this.activeFX[i];
                if (!fx.update(_this.now)) {
                    _this.activeFX.splice(i, 1);
                }
            }
            this.stats.count('updateFX', (+new Date())-epoch);
        };

        this.fx = function(name, opts) {
            if (!_this.fxUpdaters.hasOwnProperty(name)) {
                throw "Can't create FX for unregistered FX type: " + name;
            }
            _this.activeFX.push(new _this.fxUpdaters[name](opts));
        };

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
                _this.map.drawDebugRegions(_this.ctx);
            }

            drawDebug();

            _this.lastFrameTime = _this.now;

            //console.log(_this.stats.averages);
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


        this.actioning = function(action) {
            return _this.keyboard.actionPressed(action);
        };

        /* TODO: Rename scroll methods to better reflect the fact that it sets
         * the map position rather than animatedly scroll it. */

        this.scroll = function(dx,dy) {
            _this.map.scroll(dx, dy);
        };

        /** Sets the map position to centre on a given world coordinate.
         * @param {Number} x World X position
         * @param {Number} y World Y position
         */
        this.scrollTo = function(x,y) {
            _this.map.scrollTo(x, y);
        };

        this.getWorldEdges = function() {
            return _this.map.getWorldEdges();
        };

        this.drawWorld = function() {
            this.map.drawWorld(_this.ctx, _this.now, _this.sprites);
        };

        this.drawSpriteWorld = function(name) {
            _this.spriteMap[name].draw(_this.ctx, _this.map.xoffset, _this.map.yoffset, _this.now);
        };

        this.mouseScreenPos = function(out) {
            out[0] = _this.mouse.x;
            out[1] = _this.mouse.y;
        };

        this.mouseWorldPos = function(out) {
            _this.map.screenToWorldPos(_this.mouse.x, _this.mouse.y, out);
        };

        /** Takes a world position and tells you what tile it lies on. Take
         * care with the return value, the function signature is all backwards.
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

        this.screenToWorldPos = function(x, y, out) {
            this.map.screenToWorldPos(x,y, out);
        };

        this.worldToScreenPos = function(x, y, out) {
            this.map.worldToScreenPos(x,y, out);
        };

        /** Get a tile by it's row and column position in the original map data.
         * @param  {object} layer. The layer to search for tiles.
         * @param  {Number} c The column, aka x position in the data.
         * @param  {Number} r the row, aka y position in the data.
         * @return {Tile} A tile, or null if the input was out of range.
         */
        this.getTile = function(layer, c, r) {
            return this.map.getTile(layer, c, r);
        };

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

        this.getTilePropAtWorldPos = function(prop, x, y) {
            return this.map.getTilePropAtWorldPos(prop, x,y);
        };

        this.getTilePropAtTilePos = function(prop, x, y) {
            return this.map.getTilePropAtTilePos(prop, x,y);
        };

        this.createCollider = function(type, opts) {
            if(!_this.colliders.hasOwnProperty(type)) {
                throw "Warning: undefined collider plugin: " + type;
            }
            return new _this.colliders[type].fn(opts);
        };

        this.createCamera = function(name, type, opts) {
            if(!_this.cameraPlugins.hasOwnProperty(type)) {
                throw "Warning: undefined camera plugin: " + type;
            }

            if (this.cameras.hasOwnProperty(name)) {
                throw "Camera already exists: "+name;
            }

            this.cameras[name] = new _this.cameraPlugins[type].fn(opts);
            return this.cameras[name];
        };

        this.switchToCamera = function(name) {
            this.camera = this.cameras[name];
        };

        /**
         * Spawn a new sprite in the world
         * @param defName The name of the sprite definition to use. These are
         * set up in your game's spriteDefs data.
         * @param stateName The initial state. This too is defined in the
         * sprite's definition, in your game's spriteDefs data.
         * @param {Function/Number} x The world x coordinate. If a function, it should take
         * no parameters and return a number.
         * @param {Function/Number} y The world y coordinate. If a function, it should take
         * no parameters and return a number.
         * @param {Function/Number} h The height off the ground. If a function, it should take
         * no parameters and return a number.
         * @param Optional parameter object, which can contain:
         * 'id' if you want to be able to find your sprite again.
         * 'maxloops' if your sprite should remove itself from the world
         * after it's looped around its animation a certain number of times. Can be a function, like
         * the world position parameters.
         * Normally you'd set this to 1 for things like explosions.
         * 'update' An array of functions that are called in-order for this
         * sprite.
         * 'endCallback' A function called when the sprite naturally ends
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
         * checked in a timely fashion by the game, via checkTimer.
         * @param A name for the timer. Use this to check the timer later.
         * @param When to set the timer for in ms. E.g. 1000 == 1s in the future.
         */
        this.markTime = function(name, time) {
            _this.timers[name] = _this.now + time;
        };

        /** Checks to see if a timer set with markTime has passed.
         * @param name The name of the timer to check.
         * @param resetMs Optional. If omitted, the timer will be removed. If
         * present, the timer will be reset, adding resetMs to its current
         * expired trigger time.
         * @return true if the timer has triggered. Note that an immediate
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

        this.sprite = function(sprite) {
            return _this.spriteMap[sprite];
        };

        this.updateSprites = function() {
            var epoch = +new Date();
            var keepsprites = [];
            var i, s;
            for (i = 0; i < _this.sprites.length; i++) {
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
            this.stats.count('updateSprites', (+new Date())-epoch);
        };

        this.getNow = function() {
            return _this.now;
        };

        this.createPhaser = function(name, opts) {
            if (!_this.phaserPlugins.hasOwnProperty(name)) {
                throw "Can't create phaser for unregistered type: " + name;
            }

            var phaser = new _this.phaserPlugins[name].fn('id'+uid(), opts);
            _this.phasers.push(phaser);
            return phaser;
        };

        this.resizeCanvas = function() {

            var c = document.getElementById(canvasID);
            this.clientWidth = c.clientWidth;
            this.clientHeight = c.clientHeight;

            _this.map.onResize(c.clientWidth, c.clientHeight);
        };
    }

    Snaps.util = util;

    return Snaps;
});
