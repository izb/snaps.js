/*global late_require:true*/

define(['sprites/spritedef',
        'sprites/sprite',
        'input/keyboard',
        'input/mouse',
        'util/all',
        'map/staggered-isometric',

        /* Plugins */
        'plugins/default-plugins',

        /* Non-referenced */
        'polyfills/requestAnimationFrame'],

function(SpriteDef, Sprite, Keyboard, Mouse, util, StaggeredIsometric,
        regPlugins) {

    'use strict';

    var debugText = util.debug.debugText;
    var copyProps = util.js.copyProps;
    var Preloader = util.Preloader;

    function Snaps(game, canvasID, settings) {

        var _this = this;

        this.util = util;

        var stats = null;

        if (settings.showFps) {
            late_require(['stats'], function(Stats) {
                stats = new Stats();
                var statEle = stats.domElement;

                statEle.style.position = 'absolute';
                statEle.style.left = '0px';
                statEle.style.top = '0px';

                document.body.appendChild(statEle);
            });
        }

        this.dbgShowMouse = !!settings.showMouse;
        this.dbgShowCounts = !!settings.showCounts;
        this.dbgShowRegions = !!settings.showRegions;
        this.dbgShowMouseTile = !!settings.showMouseTile;

        this.imageCache = {};

        this.spriteUpdaters = {};
        this.colliders = {};
        this.fxUpdaters = {};

        this.timers = {};

        this.activeFX = [];

        _this.now = +new Date();

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
            this.map = new StaggeredIsometric(game.map, game.hitTests, this.clientWidth, this.clientHeight);
        }

        var draw = _this.game.draw;
        var update = _this.game.update;

        this.spriteDefs = {};
        this.sprites = [];
        this.spriteMap = {};

        this.lastFrameTime = +new Date();

        this.registerSpriteUpdater = function(name, fn, init) {
            _this.spriteUpdaters[name] = {fn:fn, init:init};
        };

        this.registerFxPlugin = function(name, fn, init) {
            init.call(this);
            _this.fxUpdaters[name] = fn;
        };

        this.registerColliderPlugin = function(name, fn, init) {
            _this.colliders[name] = {fn:fn, init:init};
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

                var data = _this.game.spriteDefs[tag];
                var sd = new SpriteDef(image, data.w, data.h, data.x, data.y);
                _this.spriteDefs[tag] = sd;

                for (var state in data.states) {
                    sd.addState(state, data.states[state].seq, data.states[state].dur);
                }
            };
            for(var spriteName in _this.game.spriteDefs) {
                preloader.add(_this.game.spriteDefs[spriteName].path, spriteName, storeSpriteSheet);
            }
        }

        this.drawImage = function(im, x, y) {
            _this.ctx.drawImage(_this.imageCache[im],x,y);
        };

        this.cls = function() {
            _this.ctx.fillStyle = '#000';
            _this.ctx.fillRect (0,0,_this.clientWidth,_this.clientHeight);
        };

        this.bindKeys = function(keybinds) {
            for (var i = 0; i < keybinds.length; i++) {
                var keybind = keybinds[i];
                _this.keyboard.bind(keybind.key, keybind.action);
            }
        };

        this.updateFX = function(now) {
            for (var i = _this.activeFX.length - 1; i >= 0; i--) {
                var fx = _this.activeFX[i];
                if (!fx.update(now)) {
                    _this.activeFX.splice(i, 1);
                }
            }
        };

        this.fx = function(name, opts) {
            if (!_this.fxUpdaters.hasOwnProperty(name)) {
                throw "Can't spawn FX for unregistered FX type: " + name;
            }
            _this.activeFX.push(new _this.fxUpdaters[name](opts));
        };

        function drawDebug() {

            if (_this.dbgShowMouse) {
                debugText(_this.ctx,
                        "Screen: "+_this.mouse.x+","+_this.mouse.y,5, 15);
                debugText(_this.ctx,
                        "World: "+(_this.mouse.x+_this.xoffset)+","+(_this.mouse.y+_this.yoffset), 5, 30);
                debugText(_this.ctx,
                        "Origin: "+(_this.xoffset)+","+(_this.yoffset), 5, 45);
            }

            if (_this.dbgShowCounts) {
                debugText(_this.ctx,
                        "Sprites: "+_this.sprites.length,5, _this.clientHeight-15);
            }

            if (_this.dbgShowMouseTile && _this.map!==undefined) {
                var worldPos = _this.mouseWorldPos();
                var tilePos = _this.worldToTilePos(worldPos.x, worldPos.y);
                debugText(_this.ctx,
                        "Mouse in tile: "+tilePos.x+", "+tilePos.y,5, _this.clientHeight-30);
            }
        }

        function loop() {
            window.requestAnimationFrame(loop);
            if (stats!==null) {
                stats.begin();
            }

            _this.now = +new Date();

            var time = _this.now - _this.lastFrameTime;
            _this.updateFX(time);
            update(time);
            draw(_this.ctx);
            if (_this.dbgShowRegions && _this.map!==undefined) {
                _this.map.drawDebugRegions(_this.ctx, _this.xoffset, _this.yoffset);
            }

            drawDebug();

            _this.lastFrameTime = _this.now;

            if (stats!==null) {
                stats.end();
            }
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
                    setTimeout(loop, 0);
                },

                /* Preloader progress */
                function(progress) {
                    if (typeof _this.game.onProgress === 'function') {
                        _this.game.onProgress(progress, _this.ctx);
                    }
                },

                /* Preloading failed */
                function() {
                    _this.game.onLoadError();
                }
            );


        this.actioning = function(action) {
            return _this.keyboard.actionPressed(action);
        };

        this.scroll = function(dx,dy) {
            _this.map.scroll(dx, dy);
        };

        this.drawWorld = function() {
            this.map.drawWorld(_this.ctx, _this.now, _this.sprites);
        };

        this.drawSpriteWorld = function(name) {
            _this.spriteMap[name].draw(_this.ctx, _this.map.xoffset, _this.map.yoffset, _this.now);
        };

        this.mouseScreenPos = function() {
            return {x:_this.mouse.x, y:_this.mouse.y};
        };

        this.mouseWorldPos = function() {
            return _this.map.screenToWorldPos(_this.mouse.x, _this.mouse.y);
        };

        this.worldToTilePos = function(x, y) {
            return this.map.worldToTilePos(x,y);
        };

        this.screenToTilePos = function(x, y) {
            return this.map.screenToTilePos(x,y);
        };

        this.screenToWorldPos = function(x, y) {
            return this.map.screenToWorldPos(x,y);
        };

        this.createCollider = function(type, opts) {
            if(!_this.colliders.hasOwnProperty(type)) {
                throw "Warning: undefined collider plugin: " + type;
            }
            return new _this.colliders[type].fn(opts);
        };

        this.nextName = 1;

        /**
         * Spawn a new sprite in the world
         * @param defName The name of the sprite definition to use. These are
         * set up in your game's spriteDefs data.
         * @param stateName The initial state. This too is defined in the
         * sprite's definition, in your game's spriteDefs data.
         * @param x The world x coordinate
         * @param y The world y coordinate
         * @param h The height off the ground.
         * @param Optional parameter object, which can contain:
         * 'name' if you want to be able to find your sprite again.
         * 'maxloops' if your sprite should remove itself from the world
         * after it's looped around its animation a certain number of times.
         * Normally you'd set this to 1 for things like explosions.
         * 'update' An array of functions that are called in-order for this
         * sprite.
         * 'endCallback' A function called when the sprite naturally ends
         */
        this.spawnSprite = function(defName, stateName, stateExt, x, y, h, opts) {

            if (opts===undefined) {
                opts = {};
            }

            var name = opts.name;

            if (name===undefined) {
                name = "unnamed"+_this.nextName;
                _this.nextName++;
            } else {
                if(_this.spriteMap.hasOwnProperty(name)) {
                    throw "Warning: duplicate sprite name " + name;
                }
            }

            var sd = _this.spriteDefs[defName];

            var updates = opts.updates;
            if (updates !== undefined) {
                updates = new Array(opts.updates.length);
                for (var i = 0; i < opts.updates.length; i++) {
                    updates[i] = _this.spriteUpdaters[opts.updates[i]];
                }
            }

            var s = new Sprite(_this, sd, x, y, h, opts.maxloops, updates, opts.collider, opts.endCallback);
            s.setState(stateName, stateExt);

            if (opts.opts !== undefined) {
                for(var opt in opts.opts) {
                    s[opt]=opts.opts[opt];
                }
            }

            s.init();

            /* TODO: error cases */
            _this.sprites.push(s);
            _this.spriteMap[name] = s;
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

        this.moveSprite = function(sprite, x, y, h) {
            _this.spriteMap[sprite].moveTo(x,y,h);
        };

        this.updateSprites = function() {
            var keepsprites = [];
            for (var i = 0; i < _this.sprites.length; i++) {
                var s = _this.sprites[i];
                if (s.isActive(_this.now)) {
                    s.update();
                    keepsprites.push(s);
                } else {
                    delete _this.spriteMap[s.name];
                }
            }
            _this.sprites = keepsprites;
        };

        this.getNow = function() {
            return _this.now;
        };

        this.resizeCanvas = function() {
            /* TODO: Remember the map should be resized to the new client width/height too */
        };
    }

    Snaps.util = util;

    return Snaps;
});
