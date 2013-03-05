
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
                pos[0], pos[1],
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
            pos.push([x,y]);
        }
        this.states[name] = new State(pos, dur, this);
    };

    return SpriteDef;

});

define('sprites/sprite',[],function() {

    

    /** Creates a new sprite object.
     * @param {Object} sn Snaps engine ref
     * @param {Object} def The sprite definition to use
     * @param {Number} x X world position
     * @param {Number} y Y world position
     * @param {Number} h Height from the ground
     * @param {Number} maxloops How many times should the initial state loop
     * before the sprite is automatically destroyed? Set to 0 or undefined
     * if it does not automatically expire.
     * @param {Array} updates An array of functions to call to update this sprite.
     * @param {Object} collider A collider to test for collisions during movement
     * @param {Function} endCallback An optional function to call when the sprite is
     * destroyed.
     */
    function Sprite(sn, def, x, y, h, maxloops, updates, collider, endCallback) {
        this.def = def;
        this.sn = sn;
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
        this.endCallback = endCallback;
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
        if (this.active && this.maxloops>0 && this.state.dur * this.maxloops <= (now - this.epoch)) {
            this.active = false;

            if (this.endCallback!==undefined) {
                this.endCallback();
            }
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
        this.epoch = this.sn.getNow();
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

    Sprite.prototype.drawAt = function(ctx, screenx, screeny, now) {
        if (!this.active) {
            /* This may have been set by prior call to update, so check here */
            return;
        }
        var x = this.x - screenx - this.def.x;
        var y = this.y - screeny - this.def.y - this.h;

        this.state.draw(ctx, screenx, screeny, this.epoch, now);
    };

    /** Move a sprite, taking collision into account. If there is a collision,
     * the sprite will be moved to the point of collision.
     * @param  {Number} tx Target x
     * @param  {Number} ty Target y
     * @param  {Number} th Target height
     */
    Sprite.prototype.moveTo = function(tx,ty,th) {
        var dx = tx-this.x;
        var dy = ty-this.y;
        this.x=tx;
        this.y=ty;
        this.directionx = this.x + dx;
        this.directiony = this.y + dy;
        if (th!==undefined) {
            this.h=th;
        }
    };

    /** Sets the direction of the sprite. This is expressed as a world
     * position to look towards. This is not used in sprite rendering
     * directly, but can be picked up by plugins. Direction is set automatically
     * if the sprite moves, but you can then override direction by calling this.
     * @param {Number} tox World X position to orient towards.
     * @param {Number} toy World Y position to orient towards.
     */
    Sprite.prototype.setDirection = function(tox, toy) {
        this.directionx = tox;
        this.directiony = toy;
    };

    Sprite.prototype.draw = function(ctx, offsetx, offsety, now) {
        this.drawAt(
                ctx,
                this.x - offsetx - this.def.x,
                this.y - offsety - this.def.y - this.h,
                now);
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

define('util/bitmap',[],function() {

    

    return {
        imageToRData: function(image)
        {
            var w = image.width;
            var h = image.height;

            var canvas = document.createElement('canvas');
            canvas.height = h;
            canvas.width = w;
            var ctx = canvas.getContext('2d');

            ctx.drawImage(image, 0, 0);

            var rgba = ctx.getImageData(0,0,w,h).data;

            var r = new Array(rgba.length/4);

            for (var i = 0; i < r.length; i++) {
                r[i] = rgba[i*4];
            }

            return r;
        }
    };

});

define('util/debug',[],function() {

    

    return {

        debugText: function(ctx, text, x, y) {
            ctx.fillStyle = "black";
            ctx.font = "bold 16px Arial";
            ctx.fillText(text,x+1, y);
            ctx.fillText(text,x-1, y);
            ctx.fillText(text,x, y+1);
            ctx.fillText(text,x, y-1);
            ctx.fillStyle = "white";
            ctx.fillText(text,x, y);
        }

    };

});

define('util/js',[],function() {

    

    /** Convert a click event position (event.pageX/Y) into coords relative
     * to a canvas.
     */
    HTMLCanvasElement.prototype.relCoords = function(x,y,out){

        /* TODO: Doesn't the mouse handler do this too? Consolidate this code. */
        var rect = this.getBoundingClientRect();
        out[0] = x - rect.left - window.pageXOffset;
        out[1] = y - rect.top - window.pageYOffset;
    };

    return {

        copyProps: function(s,d) {
            for (var prop in s) {
                if (s.hasOwnProperty(prop)) {
                    d[prop] = s[prop];
                }
            }
            return d;
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
    'util/bitmap',
    'util/debug',
    'util/js',
    'util/url'],
function(Preloader, rnd, Bitmap, debug, js, Url) {

    

    return {
        Preloader: Preloader,
        rnd: rnd,
        js: js,
        debug: debug,
        Bitmap: Bitmap,
        Url: Url
    };

});

define('map/tile',[],function() {

    

    function Tile(img, x, y, w, h, xoverdraw, yoverdraw, defaultProps, properties) {
        this.img = img;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.xoverdraw = xoverdraw;
        this.yoverdraw = yoverdraw;
        this.defaultProps = defaultProps||{};
        this.properties = properties||{};
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

    Tile.prototype.getProperty = function(prop) {
        if (this.properties.hasOwnProperty(prop)) {
            return this.properties[prop];
        }

        if (this.defaultProps.hasOwnProperty(prop)) {
            return this.defaultProps[prop];
        }

        return undefined;
    };

    return Tile;

});

define('map/staggered-isometric',['map/tile', 'util/bitmap', 'util/debug', 'util/js'], function(Tile, Bitmap, debug, js) {

    

    var debugText = debug.debugText;
    var copyProps = js.copyProps;

    var xy = [0,0]; // work area

    function StaggeredIsometric(tileData, hitTests, clientWidth, clientHeight) {
        this.data = tileData;
        this.hitTests = hitTests;
        this.maxXOverdraw = 0;
        this.maxYOverdraw = 0;
        this.clientWidth = clientWidth;
        this.clientHeight = clientHeight;


       this.minxoffset = this.data.tilewidth/2;
       this.minyoffset = this.data.tileheight/2;

       this.maxxoffset = this.data.width * this.data.tilewidth - this.clientWidth;
       this.maxyoffset = this.data.height * (this.data.tileheight/2) - this.clientHeight;

        /* Start in SW-corner by default */
        this.xoffset = this.minxoffset;
        this.yoffset = this.maxyoffset;

    }

    /** Values returned from this function should be cached.
     */
    StaggeredIsometric.prototype.minOffsets = function() {

        return {
            minxoffset: this.data.tilewidth/2,
            minyoffset: this.data.tileheight/2,

            maxxoffset: this.data.width * this.data.tilewidth - this.clientWidth,
            maxyoffset: this.data.height * (this.data.tileheight/2) - this.clientHeight
        };

    };

    StaggeredIsometric.prototype.primePreloader = function(preloader) {

        var map = this.data;
        var _this = this;

        /* Add tiles to the preloader */
        var storeTile = function(image, ts){
            ts.image = image;
        };

        for (var i = 0; i < map.tilesets.length; i++) {
            var ts = map.tilesets[i];
            preloader.add(ts.image, ts, storeTile);
        }

        var storeHitTest = function(image, name) {
            if (image.width!==map.tilewidth || image.height!==map.tileheight) {
                throw "Hit test image "+name+" does not match map tile size";
            }

            if (name==='hit') {
                _this.hitTest = Bitmap.imageToRData(image);
            } else {
                /* TODO: Figure out what to do with custom hit test images */
            }
        };

        for(var testName in this.hitTests) {
            preloader.add(this.hitTests[testName], testName, storeHitTest);
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

    StaggeredIsometric.prototype.resolveTiles = function() {

        var i, j, k, ts, tileprops;

        var map = this.data;

        for (k = map.tilesets.length - 1; k >= 0; k--) {
            ts = map.tilesets[k];
            ts.xspan = Math.floor(ts.imagewidth / ts.tilewidth);
            ts.yspan = Math.floor(ts.imageheight / ts.tileheight);
        }

        for (i = 0; i < map.layers.length; i++) {
            var l = map.layers[i];
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
                    var y = Math.floor(t / ts.xspan);
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
                    row = [];
                }
            }
        }
    };

    StaggeredIsometric.prototype.drawDebugRegions = function(ctx) {

        var map = this.data;
        var l, layerEndY, layerEndX, r, x, y, i, stagger;

        var xstep = map.tilewidth;
        var ystep = map.tileheight / 2;

        var starty = Math.floor((this.yoffset-ystep) / ystep);
        var endy = Math.floor((this.yoffset+this.clientHeight-ystep+this.maxYOverdraw) / ystep)+1;

        var startx = Math.floor((this.xoffset+this.clientWidth -1 ) / xstep);
        var endx = Math.floor((this.xoffset-xstep/2-this.maxXOverdraw) / xstep);

        l = map.layers[0];

        layerEndY = Math.min(endy, l.rows.length-1);
        layerEndX = Math.max(endx, 0);

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
                ctx.strokeStyle = redgreen;
                var rx = Math.floor(-this.xoffset) + stagger + x * xstep;
                var ry = Math.floor(-this.yoffset) + y * ystep;
                var rw = map.tilewidth;
                var rh = map.tileheight;

                ctx.strokeRect(rx, ry, rw, rh);
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
                debugText(ctx,
                        x+","+y,
                        85+Math.floor(-this.xoffset) + stagger + x * xstep,
                        55+Math.floor(-this.yoffset) + y * ystep);
            }
        }
    };

    StaggeredIsometric.prototype.scroll = function(dx,dy) {
        this.xoffset+=dx;
        this.yoffset+=dy;

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

    StaggeredIsometric.prototype.getScreenEdges = function() {
        return {
            le:this.minxoffset,
            te:this.minyoffset,
            re:this.maxxoffset+this.clientWidth,
            be:this.maxyoffset+this.clientHeight
        };
    };

    StaggeredIsometric.prototype.worldToTilePos = function(x, y, out) {
        // http://gamedev.stackexchange.com/a/48507/3188

        var map = this.data;

        var tw = map.tilewidth;
        var th = map.tileheight;

        var eventilex = Math.floor(x%tw);
        var eventiley = Math.floor(y%th);

        if (this.hitTest[eventilex + eventiley * tw] !== 255) {
            /* On even tile */

            out[0] = Math.floor((x + tw) / tw) - 1;
            out[1] = 2 * (Math.floor((y + th) / th) - 1);

        } else {
            /* On odd tile */

            out[0] = Math.floor((x + tw / 2) / tw) - 1;
            out[1] = 2 * (Math.floor((y + th / 2) / th)) - 1;
        }
    };

    StaggeredIsometric.prototype.getTilePropAtWorldPos = function(prop, x, y) {
        this.worldToTilePos(x, y, xy);
        var layers = this.data.layers;
        var propval;
        for (var i = layers.length - 1; i >= 0; i--) {
            var rows = layers[i].rows;
            if (rows!==undefined) {
                if (xy[1]>=0&&xy[1]<rows.length) {
                    var t = rows[xy[1]][xy[0]];
                    if (t) {
                        propval = t.getProperty(prop);
                        if (propval!==undefined) {
                            return propval;
                        }
                    }
                }
            }
        }
        return undefined;
    };

    StaggeredIsometric.prototype.screenToTilePos = function(x, y, out) {
        this.worldToTilePos(x+this.xoffset, y+this.yoffset, out);
    };

    /** Convert a screen coordinate to a world coordinate.
     * @param {Array} out Returned values via passed-in array. Must be 2-length.
     * Order is x,y
     * @return {undefined} See 'out'
     */
    StaggeredIsometric.prototype.screenToWorldPos = function(x,y,out) {
        out[0] = x+this.xoffset;
        out[1] = y+this.yoffset;
    };

    StaggeredIsometric.prototype.worldToScreenPos = function(x, y, out) {
        out[0] = x-this.xoffset;
        out[1] = y-this.yoffset;
    };

    StaggeredIsometric.prototype.insertLayer = function(idx, layer) {
        this.data.layers.splice(idx,0,layer);
    };


    StaggeredIsometric.prototype.updateLayers = function(idx, layer, now) {
        var map = this.data;
        for (var i = 0; i < map.layers.length; i++) {
            var l = map.layers[i];
            if (l.hasOwnProperty('update')) {
                l.update(now);
            }
        }
    };


    StaggeredIsometric.prototype.drawWorld = function(ctx, now, sprites) {

        var map = this.data;

        var xstep = map.tilewidth;
        var ystep = map.tileheight / 2;

        var starty = Math.floor((this.yoffset-ystep) / ystep);
        var endy = Math.floor((this.yoffset+this.clientHeight-ystep+this.maxYOverdraw) / ystep)+1;

        var startx = Math.floor((this.xoffset+this.clientWidth -1 ) / xstep);
        var endx = Math.floor((this.xoffset-xstep/2-this.maxXOverdraw) / xstep);

        /* Sort sprites first by height, then by y-axis */
        sprites.sort(function(a, b) {
            var n = a.y - b.y;
            return n!==0?n:a.h - b.h;
        });

        var spriteCursor = 0;

        var stagger = 0;
        var x, y, r, l, i, layerEndY, layerEndX;
        var top = map.layers.length-1;
        for (i = 0; i < map.layers.length; i++) {
            l = map.layers[i];

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
                    if (t!==null) {
                        t.draw(
                                ctx,
                                Math.floor(-this.xoffset) + stagger + x * xstep,
                                Math.floor(-this.yoffset) + y * ystep);
                    }
                }

                if (i==top) {
                    var z = (y+2) * ystep;
                    while(spriteCursor<sprites.length && z>=sprites[spriteCursor].y) {
                        sprites[spriteCursor++].draw(ctx, this.xoffset, this.yoffset, now);
                    }
                }
            }
        }
    };

    return StaggeredIsometric;

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
        var b = this.state.jogPos(this.epoch, this.sn.getNow());
        b*=2;
        b-=1;
        b*=b;

        this.h = this.bounce_base + this.bounce_height * (1-b);
        return true;
    };

    return function(sn) {
        sn.registerSpriteUpdater('bounce', bounce, function(){});
    };

});

define('plugins/sprite/follow-mouse',[],function() {

    

    var pos = [0,0];

    /** Called with the sprite as the 'this' context.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var followMouse = function() {

        this.sn.mouseWorldPos(pos);
        this.x = pos[0];
        this.y = pos[1];
        return true;
    };

    return function(sn) {
        sn.registerSpriteUpdater('follow_mouse', followMouse, function(){});
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
            this.link_to[i].sprite = this.sn.spriteMap[this.link_to[i].name];
        }
    };

    return function(sn) {
        sn.registerSpriteUpdater('link', link, init);
    };

});

define('plugins/sprite/8way',[],function() {

    

    /** Called with the sprite as the 'this' context.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var face8way = function() {

        var dx = this.directionx - this.x;
        var dy = 2*(this.directiony - this.y); /* Because Y is halved in isometric land */

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

    return function(sn) {
        sn.registerSpriteUpdater('8way', face8way, init);
    };

});

define('plugins/layer/occlusion-scan',['util/js'], function(js) {

    

    var copyProps = js.copyProps;

    /* A sample layer effect that performs collision traces to approximate a circular
     * occlusion scan. Just pretty, not (yet) useful. */

    /**
     * @param {Object} opts Parameters for customizing the layer. Requires these properties:
     * 'x' and 'y' The center of the scan.
     */
    function OcclusionScan(layerName, opts, sn) {
        this.opts = opts||{};
        this.name = layerName;
        this.x = opts.x;
        this.y = opts.y;
        this.sn = sn;
        this.collider = sn.createCollider('trace', {whisker:opts.whisker});
    }

    /** FX plugin callbacks should return true to continue, or false if complete.
     * @return {Boolean} See description
     */
    OcclusionScan.prototype.update = function(now) {
    };

    OcclusionScan.prototype.draw = function(ctx, now) {

        var endW = [0,0];
        var startS = [0,0];
        var limit = [0,0];
        var i,dx,dy,collided;

        for (i = -200; i < 200; i+=8) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            this.sn.mouseWorldPos(endW);

            dx = endW[0]+i - this.x;
            dy = endW[1] - this.y;
            collided = this.collider.test(
                    Math.floor(this.x),
                    Math.floor(this.y),
                    Math.floor(dx),
                    Math.floor(dy),
                    0,
                    limit);
            this.sn.worldToScreenPos(limit[0], limit[1], limit);

            this.sn.worldToScreenPos(this.x, this.y, startS);
            ctx.moveTo(startS[0], startS[1]);
            ctx.lineTo(limit[0], limit[1]);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = collided?'red':'green';
            ctx.arc(limit[0],limit[1],2.5,0,2*Math.PI);
            ctx.stroke();
        }

        for (i = -200; i < 200; i+=8) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            this.sn.mouseWorldPos(endW);

            dx = endW[0] - this.x;
            dy = endW[1]+i - this.y;
            collided = this.collider.test(
                    Math.floor(this.x),
                    Math.floor(this.y),
                    Math.floor(dx),
                    Math.floor(dy),
                    0,
                    limit);
            this.sn.worldToScreenPos(limit[0], limit[1], limit);

            this.sn.worldToScreenPos(this.x, this.y, startS);
            ctx.moveTo(startS[0], startS[1]);
            ctx.lineTo(limit[0], limit[1]);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = collided?'red':'green';
            ctx.arc(limit[0],limit[1],2.5,0,2*Math.PI);
            ctx.stroke();
        }
    };

    OcclusionScan.prototype.set = function(newconf) {
        copyProps(newconf, this);
    };

    return function(sn) {
        sn.registerLayerPlugin('occlusion-scan', OcclusionScan, function(){});
    };

});

define('sprites/composite',[],function() {

    

    function Composite(sn, x, y, h, endCallback) {
        this.sn = sn;
        this.x = x;
        this.y = y;
        this.h = h;
        this.endCallback = endCallback;
        this.active = true;
        this.sprites = [];
    }

    Composite.prototype.init = function() {
        /* TODO: Initialize composite plugins */
    };

    Composite.prototype.isActive = function(now) {

        if (!this.active) {
            return false;
        }

        var isactive = false;

        for (var i = this.sprites.length - 1; i >= 0; i--) {
            var s = this.sprites[i];
            if (s.isActive()) {
                isactive = true;
            } else {
                this.sprites.splice(i,1);
            }
        }

        this.active = isactive;

        if (!this.active && this.endCallback !== undefined) {
            this.endCallback();
        }

        return isactive;
    };

    Composite.prototype.update = function() {
        /* TODO: Call composite plugins */
    };

    Composite.prototype.draw = function(ctx, screenx, screeny, now) {
        if (!this.active) {
            /* This may have been set by prior call to update, so check here */
            return;
        }

        /* Composite's position. */
        var x = this.x - screenx - this.def.x;
        var y = this.y - screeny - this.def.y - this.h;

        for (var i = 0; i < this.sprites.length; i++) {
            var s = this.sprites[i];

            /* For sprites in a composite, the x/y position is relative to the
             * composite screen position. The height is ignored. */
            s.drawAt(ctx, x + s.x, y + s.y, now);
        }
    };

    return Composite;

});

define('plugins/fx/particles',[
    'sprites/sprite',
    'sprites/composite'
], function(Sprite, Composite) {

    

    /** Spawns particles in a composite sprite.
     * @param {Object} opts Options, in the following format
     * {
     *     number: {Function/Number}, // The number of particles to spawn, either a number or a function
     *     def: {String}, // The sprite definition to spawn
     *     state: {String}, // The sprite state to spawn
     *     duration: {Function/Number}, // The time cap on the particle animation. Individual sprites may outlive this.
     *     x: {Number}, // X world position to spawn particles
     *     y: {Number}, // Y world position to spawn particles
     *     TODO: More!
     * }
     */
    function Particles(opts) {
        this.opts = opts;

        this.number = (typeof opts.number === "number")?opts.number:opts.number();

        /* TODO: Spawn those particles! */
    }

    /** FX plugin callbacks should return true to continue, or false if complete.
     * @return {Boolean} See description
     */
    Particles.prototype.update = function(now) {
        return false;
    };

    return function(sn) {
        sn.registerFxPlugin('particles', Particles, function(){});
    };

});

define('plugins/collision/trace-collider',[],function() {

    

    function TraceCollider(opts, sn) {
        opts = opts||{};
        this.sn = sn;

        if (opts.whisker>0) {
            this.whisker = opts.whisker;
            this.sampleCount = opts.samples?opts.samples:7;
            if (this.sampleCount<3||(this.sampleCount&1)===0) {
                throw "Trace collider sample count must be an odd number 3 or higher";
            }
        } else {
            this.whisker = 0;
        }

        var edges = sn.getScreenEdges();
        this.leftEdge = edges.le;
        this.rightEdge = edges.re;
        this.topEdge = edges.te;
        this.bottomEdge = edges.be;
    }

    var doTrace = function(x0, y0, dx, dy, h, out) {

        var i;

        var w = this.whisker;

        var ox0 = x0;
        var oy0 = y0;
        var odx = dx;
        var ody = dy;

        var result;
        if (dx === 0 && dy === 0) {
            out[0] = x0;
            out[1] = y0;
            result = this.sn.getTilePropAtWorldPos('height',x0,y0);
            return (result>h);
        }

        var nwx,nwy,samples;
        if (w>0) {
            var dy2 = dy*2;
            var len = Math.sqrt((dx*dx) + (dy2*dy2));
            nwx = dx/len;
            nwy = dy/len;
            dx = Math.floor(dx+w*nwx);
            dy = Math.floor(dy+w*nwy);
            samples = new Array(2*this.sampleCount);
            var a = Math.atan2(dy*2, dx) - Math.PI/2;
            var astep = Math.PI/(this.sampleCount-1);
            var mid = Math.floor(this.sampleCount/2)*2;
            var leadx,leady;
            for (i = 0; i < this.sampleCount*2; i+=2) {
                var cs = Math.cos(a);
                var sn = Math.sin(a);

                samples[i] = w* cs;
                samples[i+1] = w*sn/2;
                if (i===mid) {
                    leadx=samples[i];
                    leady=samples[i+1];
                }
                a+=astep;
            }
            for (i = 0; i < this.sampleCount*2; i+=2) {
                samples[i] = samples[i]-leadx;
                samples[i+1] = samples[i+1]-leady;
            }
        }

        var x1 = x0 + dx;
        var y1 = y0 + dy;
        dx = Math.abs(dx);
        dy = Math.abs(dy);

        /* The mighty Bresenham's line algorithm */
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;

        var found, collided = false;
        while(true){
            if (w===0) {
                if (x0<this.leftEdge || x0>this.rightEdge || y0<this.topEdge || y0> this.bottomEdge) {
                    collided = true;
                    break;
                }
                result = this.sn.getTilePropAtWorldPos('height',x0,y0);

                if(result>h) {
                    collided = true;
                    break;
                }
            } else {
                found = false;
                for (i = 0; i < samples.length; i+=2) {
                    var sx0 = x0+samples[i];
                    var sy0 = y0+samples[i+1];

                    if (sx0<this.leftEdge || sx0>this.rightEdge || sy0<this.topEdge || sy0> this.bottomEdge) {
                        collided = true;
                        found = true;
                        break;
                    }

                    result = this.sn.getTilePropAtWorldPos('height',sx0,sy0);

                    if(result>h||result===undefined) {
                        collided = true;
                        found = true;
                        break;
                    }
                }
            }

            if (found) {
                break;
            }

            if ((x0===x1) && (y0===y1)) {
                break;
            }

            var e2 = 2*err;

            if (e2 >-dy){
                err -= dy;
                x0  += sx;
            }

            if (e2 < dx) {
                err += dx;
                y0  += sy;
            }
        }

        if (w>0 && collided) {
            /* Move the limit point to the centre, not the whisker tip. */
            x0-=(nwx*w);
            y0-=(nwy*w);
        }

        if (collided && out !==undefined) {
            if (out!==undefined) {
                out[0] = x0;
                out[1] = y0;
            }

            if (dx>dy) {
                return (ox0-x0)/(-odx);
            } else {
                return (oy0-y0)/(-ody);
            }
        } else if (out!==undefined) {
            out[0] = ox0+odx;
            out[1] = oy0+ody;
        }
        return 1;
    };

    /** Perform a trace to test for collision along a line.
     * @param  {Array} out An optional 2-length array which will recieve the
     * point of contact. You can interpret this as the position to which the
     * character can go along its path at which it will be touching a solid
     * object. If there is no collision, the output position will be the
     * desired new position.
     * @return {Boolean} True if there was a collision.
     */
    TraceCollider.prototype.test = function(x0, y0, dx, dy, h, out){
        var ratio = doTrace.call(this, x0, y0, dx, dy, h, out);
        return ratio<1;
    };

    return function(sn) {
        sn.registerColliderPlugin('trace', TraceCollider, function(){});
    };

});

define('plugins/default-plugins',[
    'plugins/sprite/bounce',
    'plugins/sprite/follow-mouse',
    'plugins/sprite/link',
    'plugins/sprite/8way',

    'plugins/layer/occlusion-scan',

    'plugins/fx/particles',

    'plugins/collision/trace-collider'
    ],
function(
        regBounce, regFollowMouse, regLink, reg8way,
        regOcclusionScan,
        regParticles,
        regTraceCollider) {

    

    /*TODO : error on loading unregistered plugin*/

    return function(sn) {
        regBounce(sn);
        regFollowMouse(sn);
        regLink(sn);
        reg8way(sn);

        regOcclusionScan(sn);

        regParticles(sn);

        regTraceCollider(sn);
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

define('snaps',['sprites/spritedef',
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
        this.layerPlugins = {};

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

        this.registerLayerPlugin = function(name, fn, init) {
            init.call(this);
            _this.layerPlugins[name] = fn;
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

        this.addLayer = function(name, type, opts, idx) {
            /* TODO: index must be in range. name must be unique. */

            if (!_this.layerPlugins.hasOwnProperty(type)) {
                throw "Can't spawn layer for unregistered layer type: " + type;
            }
            var layer = new _this.layerPlugins[type](name, opts, _this);
            _this.map.insertLayer(idx, layer);
            return layer;
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
                        "Sprites: "+_this.sprites.length,5, _this.clientHeight-15);
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

        function loop() {
            window.requestAnimationFrame(loop);
            if (stats!==null) {
                stats.begin();
            }

            _this.now = +new Date();
            var time = _this.now - _this.lastFrameTime;
            _this.updateFX(time);
            _this.map.updateLayers(time);
            update(time); /* This fn is in the game code */
            draw(_this.ctx); /* This fn is also in the game code */
            if (_this.dbgShowRegions && _this.map!==undefined) {
                _this.map.drawDebugRegions(_this.ctx);
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

        this.getScreenEdges = function() {
            return _this.map.getScreenEdges();
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

        this.worldToTilePos = function(x, y, out) {
            this.map.worldToTilePos(x,y, out);
        };

        this.screenToTilePos = function(x, y, out) {
            this.map.screenToTilePos(x,y, out);
        };

        this.screenToWorldPos = function(x, y, out) {
            this.map.screenToWorldPos(x,y, out);
        };

        this.worldToScreenPos = function(x, y, out) {
            this.map.worldToScreenPos(x,y, out);
        };

        this.getTilePropAtWorldPos = function(prop, x, y) {
            return this.map.getTilePropAtWorldPos(prop, x,y);
        };

        this.createCollider = function(type, opts) {
            if(!_this.colliders.hasOwnProperty(type)) {
                throw "Warning: undefined collider plugin: " + type;
            }
            return new _this.colliders[type].fn(opts, _this);
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

        this.sprite = function(sprite) {
            return _this.spriteMap[sprite];
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
