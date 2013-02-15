/*global late_require:true*/

define(['lodash',
        'isoengine/tile',
        'isoengine/sprites/spritedef',
        'isoengine/sprites/sprite',
        'isoengine/input/keyboard',
        'isoengine/input/mouse',
        'util/preload',

        /* Plugins */
        'isoengine/plugins/default-plugins',

        /* Non-referenced */
        'polyfills/requestAnimationFrame'],

function(_, Tile, SpriteDef, Sprite, Keyboard, Mouse, Preloader,
        regPlugins) {

    'use strict';

    function IsoEngine(game, canvasID, settings) {

        var _this = this;

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

        this.imageCache = {};

        this.spriteUpdaters = {};

        this.timers = {};

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
        var map = game.map;
        this.map = map;

        this.minxoffset = map.tilewidth/2;
        this.minyoffset = map.tileheight/2;

        this.maxxoffset = map.width * map.tilewidth - this.clientWidth;
        this.maxyoffset = map.height * (map.tileheight/2) - this.clientHeight;

        /* Start in SW-corner by default */
        this.xoffset = this.minxoffset;
        this.yoffset = this.maxyoffset;

        this.maxXOverdraw = 0;
        this.maxYOverdraw = 0;

        var draw = _this.game.draw;
        var update = _this.game.update;

        this.spriteDefs = {};
        this.sprites = [];
        this.spriteMap = {};

        this.lastFrameTime = +new Date();

        this.registerSpriteUpdater = function(name, fn, init) {
            _this.spriteUpdaters[name] = {fn:fn, init:init};
        };

        /* Register the default plugins */
        regPlugins(this);

        if (typeof _this.game.onEngineStart === 'function') {
            _this.game.onEngineStart(this);
        }

        var preloader = new Preloader();

        /* Add tiles to the preloader */
        var storeTile = function(image, ts){
            ts.image = image;
        };
        for (var i = 0; i < map.tilesets.length; i++) {
            var ts = map.tilesets[i];
            preloader.add(ts.image, ts, storeTile);
        }

        /* Add game-added images to the preloader */
        if (typeof _this.game.preloadImages === 'object') {

            var storePreloaded = function(image, tag){
                _this.imageCache[tag] = image;
            };
            for(var pathName in _this.game.preloadImages) {
                preloader.add(_this.game.preloadImages[pathName], pathName, storePreloaded);
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

        function resolveTiles() {
            var i, j, k, ts;

            for (k = _this.map.tilesets.length - 1; k >= 0; k--) {
                ts = _this.map.tilesets[k];
                ts.xspan = Math.floor(ts.imagewidth / ts.tilewidth);
                ts.yspan = Math.floor(ts.imageheight / ts.tileheight);
            }

            for (i = 0; i < _this.map.layers.length; i++) {
                var l = _this.map.layers[i];
                l.rows = [];
                var row = [];
                for (j = 0; j < l.data.length; j++) {
                    var d = l.data[j];
                    for (k = _this.map.tilesets.length - 1; k >= 0; k--) {
                        ts = _this.map.tilesets[k];
                        if(ts.firstgid<=d) {
                            break;
                        }
                    }
                    var t = d - ts.firstgid;
                    var y = Math.floor(t / ts.xspan);
                    var x = t - ts.xspan * y;

                    var xoverdraw = ts.tilewidth - _this.map.tilewidth;
                    var yoverdraw = ts.tileheight - _this.map.tileheight;

                    _this.maxXOverdraw = Math.max(xoverdraw, _this.maxXOverdraw);
                    _this.maxYOverdraw = Math.max(yoverdraw, _this.maxYOverdraw);

                    row.push(new Tile(
                            ts.image,
                            x * ts.tilewidth,
                            y * ts.tileheight,
                            ts.tilewidth,
                            ts.tileheight,
                            ts.tilewidth - _this.map.tilewidth,
                            ts.tileheight - _this.map.tileheight
                        ));
                    if (row.length>= l.width) {
                        l.rows.push(row);
                        row = [];
                    }
                }
            }
        }

        function dbugOverlays() {

            var l, layerEndY, layerEndX, r, x, y, stagger;

            var xstep = _this.map.tilewidth;
            var ystep = _this.map.tileheight / 2;

            var starty = Math.floor((_this.yoffset-ystep) / ystep);
            var endy = Math.floor((_this.yoffset+_this.clientHeight-ystep+_this.maxYOverdraw) / ystep)+1;

            var startx = Math.floor((_this.xoffset+_this.clientWidth -1 ) / xstep);
            var endx = Math.floor((_this.xoffset-xstep/2-_this.maxXOverdraw) / xstep);

            if (_this.dbgShowRegions) {

                l = _this.map.layers[0];

                layerEndY = Math.min(endy, l.rows.length-1);
                layerEndX = Math.max(endx, 0);

                for (y = starty; y <= layerEndY; y++) {
                    r = l.rows[y];
                    var redgreen;
                    if (y&1) {
                        stagger = _this.map.tilewidth/2;
                        redgreen = '#f00';
                    } else {
                        stagger = 0;
                        redgreen = '#0f0';
                    }

                    for (x = startx; x >= layerEndX; x--) {
                        _this.ctx.strokeStyle = redgreen;
                        var rx = Math.floor(-_this.xoffset) + stagger + x * xstep;
                        var ry = Math.floor(-_this.yoffset) + y * ystep;
                        var rw = _this.map.tilewidth;
                        var rh = _this.map.tileheight;

                        _this.ctx.strokeRect(rx, ry, rw, rh);
                        _this.ctx.strokeStyle = '#aaa';
                        _this.ctx.beginPath();
                        _this.ctx.moveTo(rx, ry + rh/2);
                        _this.ctx.lineTo(rx+rw/2, ry);
                        _this.ctx.lineTo(rx+rw, ry+rh/2);
                        _this.ctx.lineTo(rx+rw/2, ry+rh);
                        _this.ctx.closePath();
                        _this.ctx.stroke();
                    }
                }

                for (i = 0; i < _this.map.layers.length; i++) {
                    l = _this.map.layers[i];

                    for (y = 0; y < l.rows.length; y++) {
                        r = l.rows[y];
                        stagger = y&1?_this.map.tilewidth/2:0;
                        for (x = r.length-1; x >= 0; x--) {
                            debugText(
                                    x+","+y,
                                    85+Math.floor(-_this.xoffset) + stagger + x * xstep,
                                    55+Math.floor(-_this.yoffset) + y * ystep);
                        }
                    }
                }
            }

            if (_this.dbgShowMouse) {
                debugText(
                        "Screen: "+_this.mouse.x+","+_this.mouse.y,5, 15);
                debugText(
                        "World: "+(_this.mouse.x+_this.xoffset)+","+(_this.mouse.y+_this.yoffset),
                        5, 30);
                debugText(
                        "Origin: "+(_this.xoffset)+","+(_this.yoffset),
                        5, 45);
            }

            if (_this.dbgShowCounts) {
                debugText(
                        "Sprites: "+_this.sprites.length,5, _this.clientHeight-15);
            }
        }

        function loop() {
            window.requestAnimationFrame(loop);
            if (stats!==null) {
                stats.begin();
            }

            _this.now = +new Date();

            /* We get time jitters with requestAnimationFrame because
             * 1/60s is actually a pretty inconvenient number. To compensate
             * for this, we work out what our likely 1/60 fps is and give
             * a roughly rounded version of the timing to the game. We are
             * working on the premise that consistent error is preferable
             * to erratic accuracy with rounding errors.
             * E.g. 16/17ms jitters will all end up be reported as 16 */

            var time = _this.now - _this.lastFrameTime;
            var step = 1000/60; /* TODO: The monitor may not refresh at 60Hz. We should measure the refresh rate on startup. */
            time = Math.max(16,Math.floor((((time+12) / step)|0)*step));
            update(time);
            draw(_this.ctx);
            dbugOverlays();
            _this.lastFrameTime = _this.now;

            if (stats!==null) {
                stats.end();
            }
        }

        preloader.load(

                /* Preloading complete */
                function() {

                    /* Resolve the layers into handy image references */
                    resolveTiles();

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
            _this.xoffset+=dx;
            _this.yoffset+=dy;

            if (_this.xoffset < _this.minxoffset) {
                _this.xoffset = _this.minxoffset;
            } else if (_this.xoffset > _this.maxxoffset) {
                _this.xoffset = _this.maxxoffset;
            }

            if (_this.yoffset < _this.minyoffset) {
                _this.yoffset = _this.minyoffset;
            } else if (_this.yoffset > _this.maxyoffset) {
                _this.yoffset = _this.maxyoffset;
            }
        };

        var debugText = function(text, x, y) {
            _this.ctx.fillStyle = "black";
            _this.ctx.font = "bold 16px Arial";
            _this.ctx.fillText(text,x+1, y);
            _this.ctx.fillText(text,x-1, y);
            _this.ctx.fillText(text,x, y+1);
            _this.ctx.fillText(text,x, y-1);
            _this.ctx.fillStyle = "white";
            _this.ctx.fillText(text,x, y);
        };

        this.drawWorld = function() {
            var xstep = _this.map.tilewidth;
            var ystep = _this.map.tileheight / 2;

            var starty = Math.floor((_this.yoffset-ystep) / ystep);
            var endy = Math.floor((_this.yoffset+_this.clientHeight-ystep+_this.maxYOverdraw) / ystep)+1;

            var startx = Math.floor((_this.xoffset+_this.clientWidth -1 ) / xstep);
            var endx = Math.floor((_this.xoffset-xstep/2-_this.maxXOverdraw) / xstep);

            /* Sort sprites first by height, then by y-axis */
            this.sprites.sort(function(a, b) {
                return a.h-b.h;
            });
            this.sprites.sort(function(a, b) {
                return a.y-b.y;
            });

            var spriteCursor = 0;


            var stagger = 0;
            var x, y, r, l, i, layerEndY, layerEndX;
            for (i = 0; i < _this.map.layers.length; i++) {
                l = _this.map.layers[i];

                layerEndY = Math.min(endy, l.rows.length-1);
                layerEndX = Math.max(endx, 0);

                for (y = starty; y <= layerEndY; y++) {
                    r = l.rows[y];
                    stagger = y&1?_this.map.tilewidth/2:0;
                    for (x = startx; x >= layerEndX; x--) {
                        var t = r[x];
                        t.draw(
                                _this.ctx,
                                Math.floor(-_this.xoffset) + stagger + x * xstep,
                                Math.floor(-_this.yoffset) + y * ystep);
                    }

                    if (i==1) {
                        var z = (y+2) * ystep;
                        while(spriteCursor<this.sprites.length && z>=this.sprites[spriteCursor].y) {
                            _this.sprites[spriteCursor++].draw(_this.ctx, _this.xoffset, _this.yoffset, _this.now);
                        }
                    }
                }
            }
        };

        this.mouseScreenPos = function() {
            return {x:_this.mouse.x, y:_this.mouse.y};
        };

        this.mouseWorldPos = function() {
            return {x:_this.mouse.x+_this.xoffset, y:_this.mouse.y+_this.yoffset};
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
         */
        this.spawnSprite = function(defName, stateName, stateExt, x, y, h, opts) {

            if (opts===undefined) {
                opts = {};
            }

            if (opts.name===undefined) {
                opts.name = "unnamed"+_this.nextName;
                _this.nextName++;
            }

            var sd = _this.spriteDefs[defName];

            var updates = opts.updates;
            if (updates !== undefined) {
                updates = new Array(opts.updates.length);
                for (var i = 0; i < opts.updates.length; i++) {
                    updates[i] = _this.spriteUpdaters[opts.updates[i]];
                }
            }

            var s = new Sprite(_this, sd, x, y, h, opts.maxloops, updates);
            s.setState(stateName, stateExt);

            if (opts.opts !== undefined) {
                for(var opt in opts.opts) {
                    s[opt]=opts.opts[opt];
                }
            }

            s.init();

            /* TODO: error cases */
            _this.sprites.push(s);
            _this.spriteMap[opts.name] = s;
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
            var s = _this.spriteMap[sprite];
            s.x=x;
            s.y=y;
            if (h!==undefined) {
                s.h=h;
            }
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
            /* TODO */
        };
    }

    return IsoEngine;
});
