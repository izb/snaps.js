
define('tile',[],function() {

    

    function Tile(img, x, y, w, h, xoverdraw, yoverdraw) {
        this.img = img;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.xoverdraw = xoverdraw;
        this.yoverdraw = yoverdraw;
    }

    Tile.prototype.draw = function(ctx, x, y) {
        ctx.drawImage(
                /* src */
                this.img,
                this.x, this.y,
                this.w, this.h,
                /*dest*/
                x-this.xoverdraw, y-this.yoverdraw,
                this.w, this.h
            );
    };

    return Tile;

});

define('sprites/spritedef',[],function() {

    

    function State(seq, dur, def) {
        this.seq = seq;
        this.dur = dur;
        this.def = def;
    }

    State.prototype.jogPos = function(epoch, now) {
        var dt = now - epoch;
        dt = dt % this.dur;
        return dt / this.dur;
    };

    State.prototype.draw = function(ctx, x, y, epoch, now) {
        var def = this.def;
        var pos = this.seq[Math.floor(this.seq.length * this.jogPos(epoch, now))];

        ctx.drawImage(
                /* src */
                def.image,
                pos.x, pos.y,
                def.w, def.h,
                /*dest*/
                x, y,
                def.w, def.h
            );
    };

    function SpriteDef(image, w, h, x, y) {
        this.states = {};
        this.image = image;
        this.w = w;
        this.h = h;

        /*hotspot...*/
        this.x = x;
        this.y = y;
    }

    SpriteDef.prototype.addState = function(name, seq, dur) {
        var pos = [];
        var xmax = Math.floor(this.image.width / this.w);

        for (var i = 0; i < seq.length; i++) {
            var idx = seq[i];
            var x = this.w * (idx % xmax);
            var y = this.h * Math.floor(idx / xmax);
            pos.push({x:x,y:y});
        }
        this.states[name] = new State(pos, dur, this);
    };

    return SpriteDef;

});

define('sprites/sprite',[],function() {

    

    function Sprite(eng, def, x, y, h, maxloops, updates) {
        this.def = def;
        this.eng = eng;
        this.x = x;
        this.y = y;
        this.h = h;
        this.state = null;
        this.active = true;
        if (maxloops === undefined) {
            maxloops = 0;
        }
        this.maxloops = maxloops;
        this.updates = updates;
    }

    Sprite.prototype.init = function() {
        if (this.updates!==undefined) {
            for (var i = 0; i < this.updates.length; i++) {
                var init = this.updates[i].init;
                init.call(this);
            }
        }
    };

    Sprite.prototype.isActive = function(now) {
        if (this.maxloops>0 && this.state.dur * this.maxloops <= (now - this.epoch)) {
            this.active = false;
        }
        return this.active;
    };

    Sprite.prototype.setState = function(state, ext) {
        if (this.stateName===state && this.stateExt===ext) {
            return;
        }
        this.stateName = state;
        this.stateExt = ext;
        if (ext!==undefined && this.def.states.hasOwnProperty(state + '_' + ext)) {
            state = state + '_' + ext;
        }
        if (!this.def.states.hasOwnProperty(state)) {
            throw "Bad sprite definition. Missing state: "+state;
        }
        this.state = this.def.states[state];
        this.epoch = this.eng.getNow();
    };

    Sprite.prototype.stateName = function() {
        return this.stateName;
    };

    Sprite.prototype.hasState = function(state) {
        return this.def.states.hasOwnProperty(state);
    };

    Sprite.prototype.morphState = function(state) {
        /* TODO: Make a state transition, but maintain the jog position */
    };

    Sprite.prototype.update = function() {
        if (this.updates!==undefined) {
            for (var i = 0; i < this.updates.length; i++) {
                var update = this.updates[i].fn;
                if(!update.call(this)) {
                    /* Return false from an update function to break the chain. */
                    break;
                }
            }
        }
    };

    Sprite.prototype.draw = function(ctx, screenx, screeny, now) {
        if (!this.active) {
            /* This may have been set by prior call to update, so check here */
            return;
        }
        var x = this.x - screenx - this.def.x;
        var y = this.y - screeny - this.def.y - this.h;

        this.state.draw(ctx, x, y, this.epoch, now);
    };

    return Sprite;

});

define('input/keyboard',[],function() {

    

    function Keyboard() {

        var _this = this;

        this.keymap = {
            backspace: 8,
            tab: 9,
            enter: 13,
            pause: 19,
            capsLock: 20,
            escape: 27,
            space: 32,
            pageUp: 33,
            pageDown: 34,
            end: 35,
            home: 36,
            left: 37,
            up: 38,
            right: 39,
            down: 40,
            ins: 45,
            del: 46,

            /* Main keyboard */
            plus: 187,
            comma: 188,
            minus: 189,
            period: 190,

            shift: 16,
            ctrl: 17,
            alt: 18,

            /* top row */
            zero: 48,
            one: 49,
            two: 50,
            three: 51,
            four: 52,
            five: 53,
            six: 54,
            seven: 55,
            eight: 56,
            nine: 57,

            a: 65,
            b: 66,
            c: 67,
            d: 68,
            e: 69,
            f: 70,
            g: 71,
            h: 72,
            i: 73,
            j: 74,
            k: 75,
            l: 76,
            m: 77,
            n: 78,
            o: 79,
            p: 80,
            q: 81,
            r: 82,
            s: 83,
            t: 84,
            u: 85,
            v: 86,
            w: 87,
            x: 88,
            y: 89,
            z: 90,

            /* Number pad */
            num0: 96,
            num1: 97,
            num2: 98,
            num3: 99,
            num4: 100,
            num5: 101,
            num6: 102,
            num7: 103,
            num8: 104,
            num9: 105,

            /* More number pad */
            multiply: 106,
            add: 107,
            substract: 109,
            decimal: 110,
            divide: 111,

            /* Function keys */
            F1: 112,
            F2: 113,
            F3: 114,
            F4: 115,
            F5: 116,
            F6: 117,
            F7: 118,
            F8: 119,
            F9: 120,
            F10: 121,
            F11: 122,
            F12: 123
        };

        this.actions = [];
        this.keys = [];

        this.bind = function(key, action) {
            _this.actions[action] = 0;
            _this.keys[_this.keymap[key]] = action;
        };

        var keydown = function(e) {
            var tag = e.target.tagName;
            if (e.type !== 'keydown' || tag === 'INPUT' || tag === 'TEXTAREA')
            {
                return;
            }
            e.preventDefault();

            var keycode = e.keyCode;
            var action = _this.keys[keycode];
            if (action) {
                _this.actions[action] = keycode;
            }
        };

        var keyup = function(e) {
            if (e.type !== 'keyup')
            {
                return;
            }
            e.preventDefault();

            var keycode = e.keyCode;
            var action = _this.keys[keycode];
            if (action) {
                _this.actions[action] = 0;
            }
        };

        this.actionPressed = function(action) {
            return !!_this.actions[action];
        };

        window.addEventListener('keydown', keydown, false);
        window.addEventListener('keyup', keyup, false);
    }

    return Keyboard;

});

define('input/mouse',[],function() {

    

    function Mouse(canvas) {

        var _this = this;

        this.x = 0;
        this.y = 0;

        this.inputmap = {
            mouse1: -1,
            mouse2: -3,
            wheelUp: -4,
            wheelDown: -5
        };

        var mousemoved = function(e) {
            var rect = canvas.getBoundingClientRect();
            _this.x = e.clientX - rect.left;
            _this.y = e.clientY - rect.top;
        };

        canvas.addEventListener('mousemove', mousemoved, false);

    }

    return Mouse;

});

define('util/preload',[],function() {

    

    function Preloader() {
        this.batch = [];
        this.errorstate = false;
    }

    Preloader.prototype.add = function(file, tag, fnStore) {
        this.batch.push({file:file, tag:tag, fnStore:fnStore});
    };

    Preloader.prototype.load = function(fnComplete, fnProgress, fnError) {

        var count = this.batch.length;
        var _this = this;

        fnProgress(0);

        function loadHandler(item, img) {
            return function() {
                if (_this.errorstate) {
                    return;
                }
                count--;
                item.fnStore(img, item.tag);
                fnProgress(1-count/_this.batch.length);
                if (count===0) {
                    fnComplete();
                }
            };
        }

        function error(e) {
            if (!_this.errorstate) {
                _this.errorstate = true;
                fnError();
            }
        }

        for (var i = 0; i < this.batch.length; i++) {
            var next = this.batch[i];

            var img = new Image();
            img.onload = loadHandler(next, img);
            img.onerror = error;
            img.src = next.file;
        }

    };

    return Preloader;

});

define('util/rnd',[],function() {

    

    /* TODO: Speed test this file to see if it's bollocks. */

    /** Return a random integer.
     * @param min Lowest possible value
     * @param max Highest possible value
     */
    var rnd = function(min,max) {
        return min+Math.random()*(max-min+1)|0;
    };

    return {

        rnd: rnd,

        /** Generates a function that returns a faster random number
         * generator, but which has a setup cost.
         * e.g.
         * var nextRand = rnd.fastRand(1, 10); // The slow bit
         * var n = nextRand(); // The fast bit
         * @param min Lowest possible value
         * @param max Highest possible value
         */
        fastRand: function(min, max) {
            var lut = [];
            for (var i=10000; i>0; i--) {
                lut.push(rnd(min, max));
            }

            var pos = 0;

            return function() {
                pos++;
                if (pos===lut.length) {
                    pos = 0;
                }
                return lut[pos];
            };
        }

    };

});

define('util/url',[],function() {

    

    return {
        queryStringValue: function(name)
        {
            var match = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
            return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
        }
    };

});

define('util/all',[
    'util/preload',
    'util/rnd',
    'util/url'],
function(Preloader, rnd, Url) {

    

    return {
        Preloader: Preloader,
        rnd: rnd,
        Url: Url
    };

});

define('plugins/sprite/bounce',[],function() {

    

    /*
     * Example options:
     *
     * opts:{
     *     bounce_height:100,
     *     bounce_base:64,
     * }
     *
     * Bounces up 100px from a 'floor' height of 64px. Bounce duration
     * is the current animation sequence duration.
     */

    /** Called with the sprite as the 'this' context.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var bounce = function() {
        var b = this.state.jogPos(this.epoch, this.eng.getNow());
        b*=2;
        b-=1;
        b*=b;

        this.h = this.bounce_base + this.bounce_height * (1-b);
        return true;
    };

    return function(eng) {
        eng.registerSpriteUpdater('bounce', bounce, function(){});
    };

});

define('plugins/sprite/follow-mouse',[],function() {

    

    /** Called with the sprite as the 'this' context.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var followMouse = function() {

        var pos = this.eng.mouseWorldPos();
        this.x = pos.x;
        this.y = pos.y;
        return true;
    };

    return function(eng) {
        eng.registerSpriteUpdater('follow_mouse', followMouse, function(){});
    };

});

define('plugins/sprite/link',[],function() {

    

    /*
     * Example options:
     *
     * opts:{
     *     link_to:[
     *         {name:'shadow',x:0,y:0},
     *         {name:'head',x:10,y:0}
     *     ]
     * }
     *
     * Means that moving this sprite will also move the shadow and
     * head sprites. Height of the linked sprites is not affected,
     * only world x,y position which can be offset with the x and y
     * values on the link.
     */

    /** Called with the sprite as the 'this' context.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var link = function() {

        for (var i = this.link_to.length - 1; i >= 0; i--) {
            this.link_to[i].sprite.x = this.x + this.link_to[i].x;
            this.link_to[i].sprite.y = this.y + this.link_to[i].y;
        }
        return true;
    };

    var init = function() {
        for (var i = this.link_to.length - 1; i >= 0; i--) {
            this.link_to[i].sprite = this.eng.spriteMap[this.link_to[i].name];
        }
    };

    return function(eng) {
        eng.registerSpriteUpdater('link', link, init);
    };

});

define('plugins/sprite/8way',[],function() {

    

    /** Called with the sprite as the 'this' context.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var face8way = function() {

        var dx = this.x - this.oldx;
        var dy = 2*(this.y - this.oldy); /* Because Y is halved in isometric land */

        var d;

        if (dy===0) {
            if (dx===0) {
                d = this.direction;
            } else {
                d = dx>0?'e':'w';
            }
        } else {
            /* dy!=0 => Division is ok */
            var r = dx/dy;
            if (r>=0) {
                if (r < 0.41421) {
                    d = dy>0?'s':'n';
                } else if(r > 2.4142) {
                    d = dx>0?'e':'w';
                } else {
                    d = dx>0?'se':'nw';
                }
            } else {
                if (r > -0.41421) {
                    d = dy>0?'s':'n';
                } else if(r < -2.4142) {
                    d = dx>0?'e':'w';
                } else {
                    d = dx>0?'ne':'sw';
                }
            }
        }

        this.direction = d;

        this.oldx = this.x;
        this.oldy = this.y;

        this.setState(this.stateName, this.direction);

        return true;
    };

    var init = function() {
        this.direction = 'e';
    };

    return function(eng) {
        eng.registerSpriteUpdater('8way', face8way, init);
    };

});

define('plugins/default-plugins',[
    'plugins/sprite/bounce',
    'plugins/sprite/follow-mouse',
    'plugins/sprite/link',
    'plugins/sprite/8way'
    ],
function(regBounce, regFollowMouse, regLink, reg8way) {

    

    /*TODO : error on loading unregistered plugin*/

    return function(eng) {
        regBounce(eng);
        regFollowMouse(eng);
        regLink(eng);
        reg8way(eng);
    };

});

define('polyfills/requestAnimationFrame',[],function() {

    

    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

    // requestAnimationFrame polyfill by Erik Möller
    // fixes from Paul Irish and Tino Zijdel

    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] ||
                                   window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };

});

/*global late_require:true*/

define('snaps',['tile',
        'sprites/spritedef',
        'sprites/sprite',
        'input/keyboard',
        'input/mouse',
        'util/all',

        /* Plugins */
        'plugins/default-plugins',

        /* Non-referenced */
        'polyfills/requestAnimationFrame'],

function(Tile, SpriteDef, Sprite, Keyboard, Mouse, util,
        regPlugins) {

    

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

        var preloader = new util.Preloader();

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

    Snaps.util = util;

    return Snaps;
});
