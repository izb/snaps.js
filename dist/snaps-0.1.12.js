
/*global define*/
define('sprites/spritedef',[],function() {

    

    /**
     * @param {Array} seq Image offset sequence in the form
     * [[x0,y0],[x1,y1],[x2,y2]...]
     */
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

    State.prototype.draw = function(ctx, x, y, epoch, now, forceFinal) {
        var def = this.def;
        var pos = this.seq[
            forceFinal?
                this.seq.length-1
              : Math.floor(this.seq.length * this.jogPos(epoch, now))];

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

/*global define*/
define('sprites/sprite',[],function() {

    

    /** Creates a new sprite object.
     * @param {Object} sn Snaps engine ref
     * @param {Object} def The sprite definition to use
     * @param {Function/Number} x X world position
     * @param {Function/Number} y Y world position
     * @param {Function/Number} h Height from the ground
     * @param {Object} opts Optional configuration options. All properties are optional
     * and is in the following form:
     * {
     *     maxloops: {Function/Number} How many times should the initial state loop
     *               before the sprite is automatically destroyed? Set to 0 or undefined
     *               if it does not automatically expire.
     *     updates: {Array} An array of sprite update plugin instances that will be called
     *              with each update of this sprite.
     *     collider: {object} A collider to test for collisions during movement
     *     endCallback: {Function}An optional function to call when the sprite is destroyed.
     *     autoRemove: {bool} Optional (defaults to true). If set, the sprite will be removed
     *                 from the scene once it expires. If maxloops is set and it is not
     *                 removed, it will remain on the final frame.
     *     quantizedHeight: {bool} Optional (defaults to false). If you move x,y, and h at the
     *                 same time and the movement collides, then h will by default be altered
     *                 by the proportion of the path travelled. If this flag is true, then h will
     *                 be altered entirely, regardless of the collision.
     * }
     *
     * An example of how to pass a random range into any Function/Number parameters would be to bind
     * the rnd function in util/rnd. E.g.
     *
     * var posRange = rnd.bind(rnd,-20,20); // Random range between -20 and 20
     * var fastRand = rnd.fastRand(10,20); // Fast cached random number set
     *
     * new Sprite(sn,def,posRange,posRange,0,{maxloops:fastRand});
     *
     * Alternatively of course, you could provide your own custom parameterless number
     * generator and pass it in.
     */
    function Sprite(sn, def, x, y, h, opts) {
        opts = opts||{};

        this.def = def;
        this.sn = sn;
        this.x = typeof x === 'function'?x():x;
        this.y = typeof y === 'function'?y():y;
        this.h = typeof h === 'function'?h():h;
        this.state = null;
        this.active = true;
        if (opts.maxloops === undefined) {
            this.maxloops = 0;
        } else {
            this.maxloops = typeof opts.maxloops === 'function'?opts.maxloops():opts.maxloops;
        }
        this.updates = opts.updates;
        if (this.updates!==undefined) {
            for (var i = 0; i < this.updates.length; i++) {
                this.updates[i].sprite = this;
            }
        }
        this.endCallback = opts.endCallback;
        this.collider = opts.collider; /* TODO: use this. */
        this.autoRemove = opts.autoRemove;
        if (this.autoRemove===undefined) {
            this.autoRemove = true;
        }

        this.phaserData = opts.phaserData;

        this.collisionPoint = [0,0];

        this.quantizedHeight = !!opts.quantizedHeight;
    }

    Sprite.prototype.init = function() {
        if (this.updates!==undefined) {
            for (var i = 0; i < this.updates.length; i++) {
                this.updates[i].init();
            }
        }
    };

    /** Returns the max duration of the sprite before it automatically expires.
     * This value may change if the state changes. Does not take time already
     * expired into account.
     * @return {Number} The max duration of the current state, or 0 if it will not
     * expire.
     */
    Sprite.prototype.maxDuration = function() {
        if (this.maxloops===0) {
            return 0;
        }
        return this.state.dur * this.maxloops;
    };

    Sprite.prototype.isActive = function(now) {
        if (this.active && this.maxloops>0 && this.state.dur * this.maxloops <= (now - this.epoch)) {
            this.active = false;

            if (this.endCallback!==undefined&&this.autoRemove) {
                this.endCallback();
            }
        }
        return this.active||!this.autoRemove;
    };

    Sprite.prototype.setState = function(state, ext) {

        this.active = true;

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
        /* TODO: Make a state transition, but maintain the jog position. Note that the jog position
         * may be clamped to the last frame if autoRemove is false and the internal active flag is set.
         */
    };

    Sprite.prototype.update = function(now) {

        if (this.updates!==undefined) {
            for (var i = 0; i < this.updates.length; i++) {
                var update = this.updates[i];
                var phaseOn = update.phaser===undefined?true:update.phaser.phase(this);
                if(!update.update(now, phaseOn)) {
                    /* Return false from an update function to break the chain. */
                    break;
                }
            }
        }
    };

    Sprite.prototype.drawAt = function(ctx, screenx, screeny, now) {
        if (!this.active && this.autoRemove) {
            /* This may have been set by prior call to update, so check here */
            return;
        }

        this.state.draw(ctx, screenx, screeny, this.epoch, now, (!this.active && !this.autoRemove));
    };

    /** Move a sprite to a point, taking collision into account.
     * If there is a collision, the sprite will be moved to the point of collision.
     * @param  {Number} tx Target x world position
     * @param  {Number} ty Target y world position
     * @param  {Number} th Optional; Target height
     */
    Sprite.prototype.moveTo = function(tx,ty,th,collide) {
        if (th!==undefined) {
            th=th-this.h;
        }

        this.move(tx-this.x,ty-this.y,th, collide);
    };

    /** Move a sprite by a given amount, taking collision into account.
     * If there is a collision, the sprite will be moved to the point of collision.
     * @param  {Number} dx Amount to alter x position
     * @param  {Number} dy Amount to alter y position
     * @param  {Number} dh Optional; Amount to alter height
     */
    Sprite.prototype.move = function(dx,dy,dh, collide) {

        if (!(dx||dy||dh)) {
            return;
        }

        collide = collide===undefined?true:collide;

        var collisionRatio;

        if (collide && this.collider!==undefined) {
            collisionRatio = this.collider.test(this.x, this.y, dx,dy,this.h,this.collisionPoint);
            this.x = this.collisionPoint[0];
            this.y = this.collisionPoint[1];
        } else {
            this.x=this.x+dx;
            this.y=this.y+dy;
        }

        this.directionx = this.x + dx;
        this.directiony = this.y + dy;

        if (dh!==undefined) {
            if (collide && collisionRatio<1 && !this.quantizedHeight) {
                /* If collided, we adjust the height be a proportion of the
                 * requested amount. */
                this.h+=dh*collisionRatio;
            } else {
                this.h+=dh;
            }
        }

        /* TODO: Technically, if the height is adjusted upwards and we're not quantizing
         * height, then the path should be retraced at the new height to see if it got further,
         * since technically it may have cleared the obstruction at that point.
         *
         * A retrace opportunity can be detected if the height at the collision point is lower than the
         * new height after the collision. Repeat until this is not true, or there is no collision.
         *
         * The collider would need to be rewritten to emit the height at the collision point.
         *
         * do
         * {
         *     trace
         *     adjust height
         *     retrace op?
         * }
         * while(retrace op)
         *
         * finally assign new values to sprite.
         *
         * Not implementing now, because it may be prefered to implement sampling predecates first, which
         * may render this task more difficult.
         */
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
                (this.x - offsetx - this.def.x)|0,
                (this.y - offsety - this.def.y - this.h)|0,
                now);
    };

    return Sprite;

});

/*global define*/
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
        },

        clone: function(s) {
            var d = {};
            for (var prop in s) {
                if (s.hasOwnProperty(prop)) {
                    d[prop] = s[prop];
                }
            }
            return d;
        }

    };

});

/*global define*/
define('sprites/composite',['util/js', 'sprites/sprite'], function(js, Sprite) {

    

    var copyProps = js.copyProps;
    var clone = js.clone;

    function Composite(sn, x, y, endCallback) {
        this.sn = sn;
        this.x = x;
        this.y = y;
        this.endCallback = endCallback;
        this.active = true;
        this.sprites = [];
    }

    Composite.prototype.init = function() {
        /* TODO: Initialize composite plugins */
    };

    Composite.prototype.addSprite = function(defName, stateName, x, y, h, opts) {

        if (opts===undefined) {
            opts = {};
        }

        var sd = this.sn.spriteDefs[defName];

        /* TODO: Some of this code is shared in snaps.js - refactor */
        var updates = opts.updates;
        if (updates !== undefined) {
            updates = new Array(opts.updates.length);
            for (var i = 0; i < opts.updates.length; i++) {
                updates[i] = new this.sn.spriteUpdaters[opts.updates[i].name]();
                copyProps(opts.updates[i], updates[i]);
            }
        }

        opts = clone(opts);
        opts.updates = updates;

        var s = new Sprite(this.sn, sd, x, y, h, opts);
        s.setState(stateName);

        if (opts.opts !== undefined) {
            for(var opt in opts.opts) {
                s[opt]=opts.opts[opt];
            }
        }

        s.init();

        this.sprites.push(s);

        return s;
    };

    Composite.prototype.isActive = function(now) {

        if (!this.active) {
            return false;
        }

        var isactive = false;

        for (var i = this.sprites.length - 1; i >= 0; i--) {
            var s = this.sprites[i];
            if (s.isActive(now)) {
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

    Composite.prototype.update = function(now, fnEach) {
        /* TODO: Call composite plugins */
        for (var i = this.sprites.length - 1; i >= 0; i--) {
            if (fnEach!==undefined) {
                fnEach(this.sprites[i], now);
            }
            this.sprites[i].update();
        }
    };

    Composite.prototype.draw = function(ctx, screenx, screeny, now) {
        if (!this.active) {
            /* This may have been set by prior call to update, so check here */
            return;
        }

        /* Composite's position. */
        var x = this.x - screenx;
        var y = this.y - screeny;

        for (var i = 0; i < this.sprites.length; i++) {
            var s = this.sprites[i];

            /* For sprites in a composite, the x/y position is relative to the
             * composite screen position. The height is ignored. */
            if (s.isActive(now)) {
                s.drawAt(ctx, x+s.x-s.def.y, y+s.y-s.h-s.def.y, now);
            }
        }
    };

    return Composite;

});

/*global define*/
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

/*global define*/
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

/*global define*/
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

/*global define*/
define('util/rnd',[],function() {

    

    /** Return a random integer.
     * @param min Lowest possible value
     * @param max Highest possible value
     */
    var rnd = function(min,max) {
        return min+Math.random()*(max-min+1)|0;
    };

    var rndFloat = function(min,max) {
        return min+Math.random()*(max-min+1);
    };

    var genRands = function(min, max, setsize, fn) {
        var lut = [];
        setsize = setsize||10000;
        for (var i=setsize; i>0; i--) {
            lut.push(fn(min, max));
        }

        var pos = 0;

        return function() {
            pos++;
            if (pos===lut.length) {
                pos = 0;
            }
            return lut[pos];
        };
    };

    return {

        rnd: rnd,

        rndFloat: rndFloat,

        /** Generates a function that returns a faster random number
         * generator, but which has a setup cost. If you're using a very large
         * number of random numbers, this is significantly faster.
         *
         * http://jsperf.com/precalc-random-numbers
         *
         * e.g.
         * var nextRand = rnd.fastRand(1, 10); // The slow bit
         * var n = nextRand(); // The fast bit
         * @param min Lowest possible value
         * @param max Highest possible value
         * @param {Number} setsize Optional. The number of values to
         * precalculate.
         */
        fastRand: function(min, max,setsize) {
            return genRands(min, max, setsize, rnd);
        },

        fastRandFloat: function(min, max,setsize) {
            return genRands(min, max, setsize, rndFloat);
        }

    };

});

/*global define*/
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

/*global define*/
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

/*global define*/
define('util/guid',[],function() {

    

    var next = 1;

    /* TODO: This is a uid, not a guid. */

    /** Return a unique string for identifier purposes.
     */
    return function() {
        return 'id'+(next++);
    };

});

/*global define*/
define('util/url',[],function() {

    

    return {
        queryStringValue: function(name)
        {
            var match = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
            return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
        }
    };

});

/*global define*/
define('util/all',[
    'util/preload',
    'util/rnd',
    'util/bitmap',
    'util/debug',
    'util/js',
    'util/guid',
    'util/url'],
function(Preloader, rnd, Bitmap, debug, js, guid, Url) {

    

    return {
        Preloader: Preloader,
        rnd: rnd,
        js: js,
        guid: guid,
        debug: debug,
        Bitmap: Bitmap,
        Url: Url
    };

});

/*global define*/
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

/*global define*/
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

       this.maxxoffset = this.data.width * this.data.tilewidth - this.clientWidth - 1;
       this.maxyoffset = this.data.height * (this.data.tileheight/2) - this.clientHeight - 1;

        /* Start in SW-corner by default */
        this.xoffset = this.minxoffset;
        this.yoffset = this.maxyoffset;

    }

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

    StaggeredIsometric.prototype.scroll = function(dx,dy) {
        this.scrollTo(this.xoffset+dx, this.yoffset+dy);
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

        x=x|0;
        y=y|0;

        var eventilex = Math.floor(x%tw);
        var eventiley = Math.floor(y%th);

        if (this.hitTest[eventilex + eventiley * tw] !== 255) {
            /* On even tile */

            out[0] = (((x + tw) / tw)|0) - 1;
            out[1] = 2 * ((((y + th) / th)|0) - 1);

        } else {
            /* On odd tile */

            out[0] = (((x + tw / 2) / tw)|0) - 1;
            out[1] = 2 * (((y + th / 2) / th)|0) - 1;
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

                if (i===top) {
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

/*global define*/
define('plugins/sprite/bounce',[],function() {

    

    var sn;

    function Bounce() {

    }

    /*
     * Example options:
     *
     * updates:[{
     *     name:'bounce',
     *     bounce_height:100,
     *     bounce_base:64,
     * }]
     *
     * Bounces up 100px from a 'floor' height of 64px. Bounce duration
     * is the current animation sequence duration.
     */

    /** Called with the sprite as the 'this' context.
     * @param  {Number} now The time of the current frame
     * @param  {Bool} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    Bounce.prototype.update = function(now, phaseOn) {
        var s = this.sprite;
        var b = s.state.jogPos(s.epoch, sn.getNow());
        b*=2;
        b-=1;
        b*=b;

        s.h = this.bounce_base + this.bounce_height * (1-b);
        return true;
    };

    Bounce.prototype.init = function() {
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('bounce', Bounce);
    };

});

/*global define*/
define('plugins/sprite/follow-mouse',[],function() {

    

    var pos = [0,0];
    var sn;

    function FollowMouse() {

    }

    /** Called with the update options as the 'this' context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @param  {Number} now The time of the current frame
     * @param  {Bool} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    FollowMouse.prototype.update = function(now, phaseOn) {

        sn.mouseWorldPos(pos);
        var s = this.sprite;
        s.x = pos[0];
        s.y = pos[1];
        return true;
    };

    FollowMouse.prototype.init = function() {
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('follow_mouse', FollowMouse);
    };

});

/*global define*/
define('plugins/sprite/link',[],function() {

    

    var sn;

    function Link() {

    }

    /*
     * Example options:
     *
     * updates:[{
     *     name:'link',
     *     link_to:[
     *         {name:'shadow',x:0,y:0},
     *         {name:'head',x:10,y:0}
     *     ]
     * }]
     *
     * Means that moving this sprite will also move the shadow and
     * head sprites. Height of the linked sprites is not affected,
     * only world x,y position which can be offset with the x and y
     * values on the link.
     */

    /** Called with the update options as the 'this' context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @param  {Number} now The time of the current frame
     * @param  {Bool} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */

    Link.prototype.update = function(now, phaseOn) {
        var s = this.sprite;
        for (var i = this.link_to.length - 1; i >= 0; i--) {
            this.link_to[i].sprite.x = s.x + this.link_to[i].x;
            this.link_to[i].sprite.y = s.y + this.link_to[i].y;
        }
        return true;
    };

    /** Called with the update options as the 'this' context, one of which
     * is this.sprite, which refers to the sprite being updated.
     */
    Link.prototype.init = function() {
        if (typeof this.link_to !== 'object') {
            throw "Link plugin requires a link_to option value (array)";
        }

        for (var i = this.link_to.length - 1; i >= 0; i--) {
            this.link_to[i].sprite = sn.spriteMap[this.link_to[i].name];
        }
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('link', Link);
    };

});

/*global define*/
define('plugins/sprite/animate',[],function() {

    

    var sn;

    function Animate() {

    }

    /*
     * Example options:
     *
     * updates:[{
     *     name:'animate'
     *     tween:'easeInOutCubic',
     *     props: {
     *         x: 20,
     *         y: 30
     *     },
     *     duration: 1000
     * }]
     *
     * Means the x and y properties of the sprite will adjusted by 20,30
     * over 1000ms with the easing in and out.
     *
     * If duration is omited, it will be calculated automatically from the
     * maxloops lifespan of the sprite
     */

    /** Called with the update options as the 'this' context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @param  {Number} now The time of the current frame
     * @param  {Bool} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    Animate.prototype.update = function(now, phaseOn) {
        var s = this.sprite;
        var t = now - this.epoch;
        for(var prop in this.props) {
            s[prop] = this.tweenfn(t, this.begin[prop], this.props[prop], this.duration);
        }
        return true;
    };

    /** Called with the update options as the 'this' context, one of which
     * is this.sprite, which refers to the sprite being updated.
     */
    Animate.prototype.init = function() {
        var s = this.sprite;
        if (this.duration===undefined) {
            /* If duration is omitted, take the sprite duration in its current state. */
            this.duration = s.maxDuration();
        }

        this.begin = {};
        for(var prop in this.props) {
            this.begin[prop] = s[prop];
        }

        /* Guard against /0 in tweens with a trivial minimum duration. 1ms will be guaranteed
         * to have expired on the next frame. */
        this.duration = Math.max(this.duration, 1);

        if (!sn.tweens.hasOwnProperty(this.tween)) {
            throw "Unrecognized tween in animate plugin: "+this.tween;
        }

        /* Turn the name into a fn */
        this.tweenfn = sn.tweens[this.tween];

        this.epoch = sn.getNow();
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('animate', Animate);
    };

});

/*global define*/
define('plugins/sprite/8way',[],function() {

    

    var sn;

    function Face8Way() {
    }

    /** Called with the update options as the 'this' context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @param  {Number} now The time of the current frame
     * @param  {Bool} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    Face8Way.prototype.update = function(now, phaseOn) {

        var s = this.sprite;

        var dx = s.directionx - s.x;
        var dy = 2*(s.directiony - s.y); /* Because Y is halved in isometric land */

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

        this.oldx = s.x;
        this.oldy = s.y;

        s.setState(s.stateName, this.direction);

        return true;
    };

    Face8Way.prototype.init = function() {
        this.direction = 'e';
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('8way', Face8Way);
    };

});

/*global define*/
define('plugins/layer/ui-layer',[],function() {

    

    var sn;

    /* A layer that provides user interface features in the form of mouse or touch
     * responsive widgets. */

    /**
     * @param {Object} opts Parameters for customizing the layer. Requires these properties:
     * 'x' and 'y' The center of the scan.
     */
    function UILayer(layerName, opts) {
        this.opts = opts||{};
        this.name = layerName;
    }

    UILayer.prototype.update = function(now) {
    };

    UILayer.prototype.draw = function(ctx, now) {

        /* TODO: Draw widgets */
    };

    return function(snaps) {
        sn = snaps;
        sn.registerLayerPlugin('ui-layer', UILayer, function(){});
    };

});

/*global define*/
define('plugins/layer/demo-trace',['util/js'], function(js) {

    

    var copyProps = js.copyProps;

    var sn;

    /* A sample layer effect that shows collisions for testing. TODO: Delete this please */

    /**
     * @param {Object} opts Parameters for customizing the layer. Requires these properties:
     * 'x' and 'y' The center of the scan.
     */
    function DemoTrace(layerName, opts) {
        this.opts = opts||{};
        this.name = layerName;
        this.x = opts.x;
        this.y = opts.y;
        /* TODO: Circle trace for now because I'm testing that. */
        this.collider = sn.createCollider('circle-trace', {radius:opts.radius});
    }

    DemoTrace.prototype.update = function(now) {
    };

    DemoTrace.prototype.draw = function(ctx, now) {

        var endW = [0,0];
        var startS = [0,0];
        var limit = [0,0];
        var i,dx,dy,collisionRatio;

        for (i = -200; i < 200; i+=8) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            sn.mouseWorldPos(endW);

            dx = endW[0]+i - this.x;
            dy = endW[1] - this.y;
            collisionRatio = this.collider.test(
                    Math.floor(this.x),
                    Math.floor(this.y),
                    Math.floor(dx),
                    Math.floor(dy),
                    0,
                    limit);
            sn.worldToScreenPos(limit[0], limit[1], limit);

            sn.worldToScreenPos(this.x, this.y, startS);
            ctx.moveTo(startS[0], startS[1]);
            ctx.lineTo(limit[0], limit[1]);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = collisionRatio<1?'red':'green';
            ctx.arc(limit[0],limit[1],2.5,0,2*Math.PI);
            ctx.stroke();
        }

        for (i = -200; i < 200; i+=8) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            sn.mouseWorldPos(endW);

            dx = endW[0] - this.x;
            dy = endW[1]+i - this.y;
            collisionRatio = this.collider.test(
                    Math.floor(this.x),
                    Math.floor(this.y),
                    Math.floor(dx),
                    Math.floor(dy),
                    0,
                    limit);
            sn.worldToScreenPos(limit[0], limit[1], limit);

            sn.worldToScreenPos(this.x, this.y, startS);
            ctx.moveTo(startS[0], startS[1]);
            ctx.lineTo(limit[0], limit[1]);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = collisionRatio<1?'red':'green';
            ctx.arc(limit[0],limit[1],2.5,0,2*Math.PI);
            ctx.stroke();
        }
    };

    DemoTrace.prototype.set = function(newconf) {
        copyProps(newconf, this);
    };

    return function(snaps) {
        sn = snaps;
        sn.registerLayerPlugin('demo-trace', DemoTrace, function(){});
    };

});

/*global define*/
define('plugins/fx/particles',[
    'sprites/sprite',
    'sprites/composite',
    'util/rnd'
], function(Sprite, Composite, utilRnd) {

    

    var sn;

    var rnd = utilRnd.rnd;

    /** Spawns particles in a composite sprite.
     * @param {Object} opts Options, in the following format
     * {
     *     number: {Function/Number}, // The number of particles to spawn, either a number or a function
     *     def: {String}, // The sprite definition to spawn
     *     state: {String}, // The sprite state to spawn
     *     duration: {Function/Number}, // The time cap on the particle animation. Individual sprites may outlive this.
     *     x: {Function/Number}, // X world position to spawn particles
     *     y: {Function/Number}, // Y world position to spawn particles
     *     endCallback: Called once the particles effect expires, or the composite sprite expires.
     * }
     *
     * Note there is no height spec. Height is the domain of the individual sprite within the composite.
     *
     * An example of how to pass a random range into any Function/Number parameters would be to bind
     * the rnd function in util/rnd. E.g.
     *
     * var smallRange = rnd.bind(rnd,-20,20); // Random range between -20 and 20
     * var largeRange = rnd.bind(rnd,500,2000);
     * var fastRand = rnd.fastRand(10,20); // Fast cached random number set
     *
     * sn.fx('particles', {
     *     number: 15,
     *     duration: largeRange,
     *     x:smallRange,
     *     y:smallRange
     *     // etc
     * });
     *
     * Alternatively of course, you could provide your own custom parameterless number
     * generator and pass it in.
     */
    function Particles(opts) {
        this.opts = opts;

        var number = (typeof opts.number === "number")?opts.number:opts.number();

        var cx = typeof opts.x === 'function'?opts.x():opts.x;
        var cy = typeof opts.y === 'function'?opts.y():opts.y;

        this.duration = typeof opts.duration === 'function'?opts.duration():opts.duration;
        this.epoch = sn.getNow();

        this.endCallback = opts.endCallback;

        this.comp = sn.createComposite(cx, cy, opts.name);

        while(number-->0) {
            var so = opts.spritePos||{x:0,y:0,h:0};
            var s = this.comp.addSprite(opts.def, opts.state, so.x||0, so.y||0, so.h||0, opts.spriteOpts);
            s.particleData = {
                xspeed: rnd(-400,400)/1000,
                hspeed: rnd(-600,50)/1000,
                xaccell: 0,
                haccell: 0.001,
                startx: so.x||0,
                starth: so.h||0,
                epoch: this.epoch
            };
        }
    }

    var updateSprite = function(s, now) {
        var pd = s.particleData;
        var t = now - pd.epoch;
        var ts=t*t;
        s.x=Math.floor(pd.startx+(pd.xspeed*t+(pd.xaccell*ts)/2));
        s.h=Math.floor(pd.starth-(pd.hspeed*t+(pd.haccell*ts)/2));
        if (s.h<0) {
            s.h=0;
        }
    };

    /** FX plugin callbacks should return true to continue, or false if complete.
     * @return {Boolean} See description
     */
    Particles.prototype.update = function(now) {
        this.comp.update(now, updateSprite.bind(this));
        if (this.duration!==undefined) {
            if ((now - this.epoch)>this.duration) {
                /* The particle effect will no longer manipulate the composite sprites and they will be
                 * left on-screen to expire in their own ways. */
                if (this.endCallback!==undefined) {
                    this.endCallback();
                }
                return false;
            }
        }

        var compActive = this.comp.isActive();
        if (!compActive && this.endCallback!==undefined) {
            /* All the sprites have expired in the composite, so we should expire this effect too. */
            this.endCallback();
        }
        return compActive;
    };

    return function(snaps) {
        sn = snaps;
        sn.registerFxPlugin('particles', Particles);
    };

});

/*global define*/
define('plugins/camera/push-cam',[],function() {

    

    var sn;

    /*
     * Example options:
     *
     * opts:{
     *     follow:"player1",
     * }
     *
     * Camera follows the player1 sprite
     */

    function PushCam(opts) {
        this.follow = sn.sprite(opts.follow);
        if (!this.follow) {
            throw "Camera can't follow missing sprite: "+opts.follow;
        }
    }

    PushCam.prototype.update = function(now) {
        sn.scrollTo(this.follow.x-sn.clientWidth/2, this.follow.y-sn.clientHeight/2);
    };

    return function(snaps) {
        sn = snaps;
        sn.registerCameraPlugin('pushcam', PushCam, function(){});
    };

});

/*global define*/
define('plugins/collision/lib/prop-scanner',[],function() {

    

    var traceProp = function(sn, prop, edges, x0, y0, dx, dy, h, out, route){

        var i;

        var ox0 = x0;
        var oy0 = y0;
        var odx = dx;
        var ody = dy;

        var sampleHeight;

        var x1 = (x0 + dx)|0;
        var y1 = (y0 + dy)|0;

        x0=x0|0;
        y0=y0|0;
        dx = Math.abs(x1-x0);
        dy = Math.abs(y1-y0);

        var routeidx = 0;
        if (route!==undefined) {
            route.length = 0;
            route.length = 2*(Math.max(dx, dy)+1);
        }

        if (dx === 0 && dy === 0) {
            out[0] = x0;
            out[1] = y0;
            sampleHeight = sn.getTilePropAtWorldPos(prop,x0,y0);
            return 1;
        }

        /* The mighty Bresenham's line algorithm */
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;

        var collided = false;
        var x0clear = x0;
        var y0clear = y0;

        /* Skip the first pixel, we can assume it's good. */
        if (route!==undefined) {
            route[routeidx++] = x0;
            route[routeidx++] = y0;
        }

        var e2 = 2*err;
        if (e2 >-dy){
            err -= dy;
            x0  += sx; /* Skippity */
        }
        if (e2 < dx) {
            err += dx;
            y0  += sy; /* Skip */
        }

        while(true){
            if (x0<edges.le || x0>edges.re || y0<edges.te || y0> edges.be) {
                collided = true;
                break;
            }

            sampleHeight = sn.getTilePropAtWorldPos(prop,x0,y0);

            if(sampleHeight>h) {
                collided = true;
                break;
            }

            x0clear = x0;
            y0clear = y0;

            if (route!==undefined) {
                route[routeidx++] = x0;
                route[routeidx++] = y0;
            }

            if ((x0===x1) && (y0===y1)) {
                break;
            }

            e2 = 2*err;

            if (e2 >-dy){
                err -= dy;
                x0  += sx;
            }

            if (e2 < dx) {
                err += dx;
                y0  += sy;
            }
        }

        /* Populate the output final point for the caller */
        if (collided) {
            if (out!==undefined) {
                out[0] = x0clear;
                out[1] = y0clear;
            }
        } else if (out!==undefined) {
            out[0] = ox0+odx;
            out[1] = oy0+ody;
        }

        if (route!==undefined) {
            route.length = routeidx;
        }

        /* No collision indicated by 1 in returned collision ratio */
        if (!collided) {
            return 1;
        }

        /* Return a ratio of path completed, e.g. 0.5 means half of the path
         * was traversed before being stopped by collision. */
        if (dx>dy) {
            return (out[0]-ox0)/odx;
        } else {
            return (out[1]-oy0)/ody;
        }
    };

    return traceProp;
});

/*global define*/
define('plugins/collision/lib/local-scanner',[],function() {

    

    /** Returns a bitmask representing the local pixels around a point, and how
     * solid they are.
     *
     * +-----------------+
     * |  1  |  2  |  4  |
     * +-----------------+
     * |  8  |  Pt |  16 |
     * +-----------------+
     * |  32 |  64 | 128 |
     * +-----------------+
     *
     * Where Pt is the sampled point
     */
    var localScan = function(sn, x, y, prop,limit){

        var scanmask = sn.getTilePropAtWorldPos(prop,x+1,y+1)>limit;
        scanmask = scanmask<<1|sn.getTilePropAtWorldPos(prop,x,y+1)>limit;
        scanmask = scanmask<<1|sn.getTilePropAtWorldPos(prop,x-1,y+1)>limit;
        scanmask = scanmask<<1|sn.getTilePropAtWorldPos(prop,x+1,y)>limit;
        scanmask = scanmask<<1|sn.getTilePropAtWorldPos(prop,x-1,y)>limit;
        scanmask = scanmask<<1|sn.getTilePropAtWorldPos(prop,x+1,y-1)>limit;
        scanmask = scanmask<<1|sn.getTilePropAtWorldPos(prop,x,y-1)>limit;
        scanmask = scanmask<<1|sn.getTilePropAtWorldPos(prop,x-1,y-1)>limit;

        return scanmask;
    };

    var ySlip = function(sn, x0, y0, h, dx, dy) {
        var localmask;
        var r = dx/dy;

        if (r>=2&&r<=3) {
            /* nw/se */
            localmask = localScan(sn, x0, y0, 'height',h);
            if (localmask===23) {
                return 1;
            } else if (localmask===232) {
                return -1;
            }
        } else if (r<=-2&&r>=-3) {
            /* sw/ne */
            localmask = localScan(sn, x0, y0, 'height',h);
            if (localmask===240) {
                return -1;
            } else if (localmask===15) {
                return 1;
            }
        }

        return 0;
    };

    return {
        localScan:localScan,
        ySlip:ySlip
    };
});

/*global define*/
define('plugins/collision/sprite-with-map/line-trace',[
    'plugins/collision/lib/prop-scanner',
    'plugins/collision/lib/local-scanner'],
function(traceProp, localScan) {

    

    var sn;

    var ySlip = localScan.ySlip;

    function LineTrace(opts) {
        opts = opts || {};
        this.sn = sn;
        this.edges = sn.getScreenEdges();

        if (opts.autoSlip===undefined) {
            this.autoSlip = true;
            /* TODO: This should default to true ONLY for isometric maps. */
        } else {
            this.autoSlip = opts.autoSlip;
        }
    }


    /** Perform a trace to test for collision along a line.
     * @param  {Array} out An optional 2-length array which will recieve the
     * point of contact. You can interpret this as the position to which the
     * character can go along its path at which it will be touching a solid
     * object. If there is no collision, the output position will be the
     * desired new position.
     * @return {Boolean} True if there was a collision.
     */
    LineTrace.prototype.test = function(x0, y0, dx, dy, h, out){

        if (this.autoSlip) {
            /* First, distance ourself from key jagged shapes in key directions,
             * to ensure the player can slip past isometric lines without getting
             * caught on pixels. */
            y0 += ySlip(sn, x0, y0, h, dx, dy);
        }

        return traceProp(sn,
            'height',
            this.edges,
            x0,
            y0,
            dx,
            dy,
            h, out);
    };

    return function(snaps) {
        sn = snaps;
        sn.registerColliderPlugin('line-trace', LineTrace, function(){});
    };

});

/*global define*/
define('plugins/collision/lib/ellipse',[],function() {

    /**
     * Returns an array of 0-centered sample points for an ellipse
     * using a variant of the midpoint circle algorithm.
     * HT http://geofhagopian.net/sablog/Slog-october/slog-10-25-05.htm
     * @param  {Number} rx The x radius. Pass an integer please.
     * @param  {Number} ry The y radius. Pass an integer please.
     * @return {Array} In the form [x0,y0,x1,y1...]. The points do
     * not describe a continuous path, but is complete.
     */
    return function(rx,ry) {
        var rx2 = rx * rx;
        var ry2 = ry * ry;
        var twoa2 = 2 * rx2;
        var twob2 = 2 * ry2;
        var p;
        var x = 0;
        var y = ry;
        var px = 0;
        var py = twoa2 * y;

        var s = [];

        /* Initial point in each quadrant. */
        s.push(x,y,-x,y,x,-y,-x,-y);

        /* Region 1 */
        p = Math.round (ry2 - (rx2 * ry) + (0.25 * rx2));
        while (px < py) {
            x++;
            px += twob2;
            if (p < 0) {
                p += ry2 + px;
            } else {
                y--;
                py -= twoa2;
                p += ry2 + px - py;
            }
            s.push(x,y,-x,y,x,-y,-x,-y);
        }

        /* Region 2 */
        p = Math.round (ry2 * (x+0.5) * (x+0.5) + rx2 * (y-1) * (y-1) - rx2 * ry2);
        while (y > 0) {
            y--;
            py -= twoa2;
            if (p > 0) {
                p += rx2 - py;
            } else {
                x++;
                px += twob2;
                p += rx2 - py + px;
            }
            s.push(x,y,-x,y,x,-y,-x,-y);
        }
        return s;
    };
});

/*global define*/
define('plugins/collision/sprite-with-map/circle-trace',[
    'plugins/collision/lib/prop-scanner',
    'plugins/collision/lib/ellipse',
    'plugins/collision/lib/local-scanner'],
function(traceProp, midPtEllipse, localScan) {

    

    var sn;

    var ySlip = localScan.ySlip;

    function CircleTrace(opts) {

        opts = opts||{};
        this.sn = sn;

        if (opts.radius===undefined || opts.radius===0) {
            throw "Circle trace requires a radius >0 in its options.";
        }

        this.edges = sn.getScreenEdges(); /* TODO: Can the traceprop fn get this itself? */

        /* We call this a circle trace, but we use a half-height ellipse
         * to represent the perspective distortion of the isometric
         * map. */
        this.samples = midPtEllipse(opts.radius|0, opts.radius/2|0);

        this.lineHit = [0,0];

        if (opts.autoSlip===undefined) {
            this.autoSlip = true;
            /* TODO: This should default to true ONLY for isometric maps. */
        } else {
            this.autoSlip = opts.autoSlip;
        }
    }

    /** Perform a trace to test for collision along a line with radius.
     * Effectively traces an ellipse  from one point to another, with some
     * important performance compromises in accuracy.
     * @param  {Array} out An optional 2-length array which will recieve the
     * point of contact. You can interpret this as the position to which the
     * character can go along its path at which it will be touching a solid
     * object. If there is no collision, the output position will be the
     * desired new position.
     * @return {Boolean} True if there was a collision.
     */
    CircleTrace.prototype.test = function(x0, y0, dx, dy, h, out){

        var sxo, syo, i;

        if (this.autoSlip) {
            /* First, distance ourself from key jagged shapes in key directions,
             * to ensure the player can slip past isometric lines without getting
             * caught on pixels. */
            var slip = 0;
            for (i = this.samples.length - 2; i >= 0; i-=2) {
                sxo = this.samples[i];
                syo = this.samples[i+1];
                var newslip = ySlip(sn, x0+sxo, y0+syo, h, dx, dy);

                if (slip===0) {
                    slip = newslip;
                } else if(newslip!==0 && slip!==newslip) {
                    slip = 0;
                    break;
                }
            }
            y0+=slip;
        }

        var route = []; /* Route will be populated with non-collision positions
                         * along the path. */
        var collisionRatio = traceProp(sn,
            'height',
            this.edges,
            x0, y0,
            dx, dy,
            h, this.lineHit, route);

        var routeidx = route.length - 2;
        var rx, ry;

        /* Trace backwards with the circle to find the rest point. */
        var collided = true;
        for (i = route.length - 2; i >= 2 && collided; i-=2) {
            collided = false;
            for (var j = this.samples.length - 2; j >= 0; j-=2) {
                sxo = this.samples[j];
                syo = this.samples[j+1];
                rx = route[i];
                ry = route[i+1];

                var sampleHeight = sn.getTilePropAtWorldPos('height',rx+sxo,ry+syo);

                if(sampleHeight>h) {
                    collided = true;
                    break;
                }
            }
            if (!collided) {
                if (i===route.length-2) {
                    /* Clear to the end/linear collision */
                    out[0] = this.lineHit[0];
                    out[1] = this.lineHit[1];
                    return collisionRatio;
                } else {
                    /* Clear to part-way along */
                    out[0] = rx;
                    out[1] = ry;
                    if (dx>dy) {
                        return (rx-x0)/dx;
                    } else {
                        return (ry-y0)/dy;
                    }
                }
            }
        }

        out[0] = x0;
        out[1] = y0;

        return 0;
    };

    return function(snaps) {
        sn = snaps;
        sn.registerColliderPlugin('circle-trace', CircleTrace, function(){});
    };

});

/*global define*/
define('plugins/default-plugins',[
    'plugins/sprite/bounce',
    'plugins/sprite/follow-mouse',
    'plugins/sprite/link',
    'plugins/sprite/animate',
    'plugins/sprite/8way',

    'plugins/layer/ui-layer',
    'plugins/layer/demo-trace', /* TODO: Delete and remove */

    'plugins/fx/particles',

    'plugins/camera/push-cam',

    'plugins/collision/sprite-with-map/line-trace',
    'plugins/collision/sprite-with-map/circle-trace'
    ],
function(
        regBounce, regFollowMouse, regLink, regAnimate, reg8way,
        regUILayer, regDemoScan,
        regParticles,
        regPushCam,
        regLineTrace, regCircleTrace) {

    

    return function(sn) {
        regBounce(sn);
        regFollowMouse(sn);
        regLink(sn);
        regAnimate(sn);
        reg8way(sn);

        regUILayer(sn);
        regDemoScan(sn);

        regParticles(sn);

        regPushCam(sn);

        regLineTrace(sn);
        regCircleTrace(sn);
    };

});

/*global define*/
define('animate/tween',[],function() {

    

    /* Via http://www.timotheegroleau.com/Flash/experiments/easing_function_generator.htm */

    /*
     * In all tween functions:
     * t = Current time passed since the beginning of the animation. Must be >=0.
     * Will be clamped to the duration.
     * b = The start value of the property being tweened
     * c = The desired delta. E.g. if b = 10, and you want to tween it to 30, c
     * should be 20
     * d = The duration in the same units as t.
     *
     * For the effects you should know that quintic is softer than quadratic,
     * which is softer than cubic.
     */

    return {
        linear: function(t, b, c, d)
        {
            return b+c*Math.min(1,t/d);
        },

        easeInOutCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(-2*tc + 3*ts);
        },

        easeInOutQuintic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(6*tc*ts + -15*ts*ts + 10*tc);
        },

        easeInQuintic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(tc*ts);
        },

        easeInQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            return b+c*(ts*ts);
        },

        easeInCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var tc=(t/=d)*t*t;
            return b+c*(tc);
        },

        easeInQuadratic: function(t, b, c, d) {
            t=Math.min(d,t);
            return b+c*(t*t/d);
        },

        easeOutQuintic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(tc*ts + -5*ts*ts + 10*tc + -10*ts + 5*t);
        },

        easeOutQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(-1*ts*ts + 4*tc + -6*ts + 4*t);
        },

        easeOutCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(tc + -3*ts + 3*t);
        },

        /** Opposite of easing in and out. Starts and ends linearly, but
         * comes to a pause in the middle.
         */
        easeOutInCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(4*tc + -6*ts + 3*t);
        },

        /** Moves back first before easing in.
         */
        backInCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(4*tc + -3*ts);
        },

        /** Moves back first before easing in.
         */
        backInQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(2*ts*ts + 2*tc + -3*ts);
        },

        /** Overshoots, then eases back
         */
        outBackCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(4*tc + -9*ts + 6*t);
        },

        /** Overshoots, then eases back
         */
        outBackQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(-2*ts*ts + 10*tc + -15*ts + 8*t);
        },

        /** Bounces around the target point, then settles.
         */
        bounceOut: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(33*tc*ts + -106*ts*ts + 126*tc + -67*ts + 15*t);
        },

        /** Bounces around the start point, then moves quickly to the target.
         */
        bounceIn: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(33*tc*ts + -59*ts*ts + 32*tc + -5*ts);
        }
    };

});

/*global define*/
define('ai/update-phaser',[],function() {

    function UpdatePhaser(id, phases) {
        this.id = id;
        this.phases = phases;
        if (phases<2) {
            throw "Update phasers must have at least 2 phases.";
        }
        this.buckets = new Array(phases);
        this.bucketMax = new Array(phases);
    }

    UpdatePhaser.prototype.phase = function(sprite) {
        var data = sprite.phaserData[this.id];
        return data.phase===0;
    };

    UpdatePhaser.prototype.rebalance = function(sprites) {
        var i, s, data, max = 0;
        var buckets = this.buckets;

        var desiredMax = sprites.length/this.phases;

        for (i = buckets.length - 1; i >= 0; i--) {
            buckets[i] = 0;
            this.bucketMax[i] = Math.floor((i+1)*desiredMax - Math.floor(i*desiredMax));
        }

        var clearing = [];
        for (i = sprites.length - 1; i >= 0; i--) {
            s = sprites[i];
            data = s.phaserData[this.id];
            data.phase++;
            if (data.phase>=this.phases) {
                data.phase = 0;
            }
            max = Math.max(max, ++buckets[data.phase]);
            if (buckets[data.phase]>this.bucketMax[data.phase]) {
                clearing.push(s);
            }
        }

        if (desiredMax/max<0.8) { /* TODO: Check that this ratio is accurate or useful. */

            var bucketIdx = 0;
            for (i = clearing.length - 1; i >= 0; i--) {
                s = clearing[i];
                while(buckets[bucketIdx]>=this.bucketMax[bucketIdx]) {
                    bucketIdx++;
                    if (bucketIdx===this.phases) {
                        bucketIdx = 0;
                    }
                }
                data = s.phaserData[this.id];
                buckets[data.phase]--;
                data.phase = bucketIdx;
                buckets[bucketIdx]++;
            }
        }

    };

    return UpdatePhaser;

});

/*global define*/
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

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }

});

/*global define*/
define('snaps',['sprites/spritedef',
        'sprites/sprite',
        'sprites/composite',
        'input/keyboard',
        'input/mouse',
        'util/all',
        'map/staggered-isometric',

        /* Plugins */
        'plugins/default-plugins',

        /* Animation */
        'animate/tween',

        /* AI */
        'ai/update-phaser',

        /* Non-referenced */
        'polyfills/requestAnimationFrame'],

function(SpriteDef, Sprite, Composite, Keyboard, Mouse, util, StaggeredIsometric,
        regPlugins,
        tweens,
        UpdatePhaser) {

    

    var debugText = util.debug.debugText;
    var copyProps = util.js.copyProps;
    var clone = util.js.clone;
    var Preloader = util.Preloader;
    var guid = util.guid;

    function Snaps(game, canvasID, settings) {

        var _this = this;

        /* Make some functionality directly available to the game via the engine ref */
        this.util = util;
        this.tweens = tweens;

        this.dbgShowMouse = !!settings.showMouse;
        this.dbgShowCounts = !!settings.showCounts;
        this.dbgShowRegions = !!settings.showRegions;
        this.dbgShowMouseTile = !!settings.showMouseTile;

        this.imageCache = {};

        this.spriteUpdaters = {};
        this.colliders = {};
        this.fxUpdaters = {};
        this.layerPlugins = {};
        this.cameraPlugins = {};

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
            this.map = new StaggeredIsometric(game.map, game.hitTests, this.clientWidth, this.clientHeight);
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
            for (var i = _this.phasers.length - 1; i >= 0; i--) {
                var phased = [];
                var id = _this.phasers[i].id;
                for (var j = _this.sprites.length - 1; j >= 0; j--) {
                    var s = _this.sprites[j];
                    if (s.phaserData!==undefined && s.phaserData.hasOwnProperty(id)) {
                        phased.push(s);
                    }
                }

                if (phased.length>0) {
                    _this.phasers[i].rebalance(phased);
                }
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

            window.requestAnimationFrame(loop);

            _this.now = now;
            var time = now - _this.lastFrameTime;
            _this.updateFX(now);
            _this.map.updateLayers(time);
            _this.updatePhasers();
            update(time); /* This fn is in the game code */
            if (_this.camera) {
                _this.camera.update(time);
            }
            draw(_this.ctx); /* This fn is also in the game code */
            if (_this.dbgShowRegions && _this.map!==undefined) {
                _this.map.drawDebugRegions(_this.ctx);
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
                _this.game.onLoadError();
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
         * @param {[Number]} x World X position
         * @param {[Number]} y World Y position
         */
        this.scrollTo = function(x,y) {
            _this.map.scrollTo(x, y);
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
         * no paremeters and return a number.
         * @param {Function/Number} y The world y coordinate. If a function, it should take
         * no paremeters and return a number.
         * @param {Function/Number} h The height off the ground. If a function, it should take
         * no paremeters and return a number.
         * @param Optional parameter object, which can contain:
         * 'name' if you want to be able to find your sprite again.
         * 'maxloops' if your sprite should remove itself from the world
         * after it's looped around its animation a certain number of times. Can be a function, like
         * the world position parameters.
         * Normally you'd set this to 1 for things like explosions.
         * 'update' An array of functions that are called in-order for this
         * sprite.
         * 'endCallback' A function called when the sprite naturally ends
         */
        this.spawnSprite = function(defName, stateName, stateExt, x, y, h, opts) {

            /* TODO: 'createSprite' please, for consistency. */

            if (opts===undefined) {
                opts = {};
            }

            var name = opts.name;

            if (name===undefined) {
                name = guid();
            } else {
                if(_this.spriteMap.hasOwnProperty(name)) {
                    throw "Error: duplicate sprite name " + name;
                }
            }

            if(!_this.spriteDefs.hasOwnProperty(defName)) {
                throw "Error: Missing sprite definition when spawning sprite " + defName;
            }

            var sd = _this.spriteDefs[defName];

            var updates = opts.updates;
            var phaserData;
            if (updates !== undefined) {
                updates = new Array(opts.updates.length);
                for (var i = 0; i < opts.updates.length; i++) {
                    var optUpdate = opts.updates[i];
                    var suname = optUpdate.name;
                    if (!_this.spriteUpdaters.hasOwnProperty(suname)) {
                        throw "Sprite plugin used but not registered: "+suname;
                    }
                    updates[i] = new _this.spriteUpdaters[suname]();
                    if (optUpdate.hasOwnProperty('phaser')) {
                        if (phaserData === undefined) {
                            phaserData = {};
                        }

                        phaserData[optUpdate.phaser.id] = {
                            phase:optUpdate.phaser.phases-1 /* TODO: This should be set up by the phaser. */
                        };
                    }
                    copyProps(optUpdate, updates[i]);
                }
            }

            opts = clone(opts);
            opts.updates = updates;
            opts.phaserData = phaserData;

            var s = new Sprite(_this, sd, x, y, h, opts);
            s.setState(stateName, stateExt);

            if (opts.opts !== undefined) {
                for(var opt in opts.opts) {
                    s[opt]=opts.opts[opt];
                }
            }

            s.init();

            _this.sprites.push(s);
            _this.spriteMap[name] = s;
        };

        this.createComposite = function(x,y,name,endCallback) {

            if (name===undefined) {
                name = guid();
            } else {
                if(_this.spriteMap.hasOwnProperty(name)) {
                    throw "Warning: duplicate sprite (composite) name " + name;
                }
            }

            var comp = new Composite(this, x, y, endCallback);
            comp.init();
            _this.sprites.push(comp);
            _this.spriteMap[name] = comp;
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
            var keepsprites = [];
            for (var i = 0; i < _this.sprites.length; i++) {
                var s = _this.sprites[i];
                if (s.isActive(_this.now)) {
                    s.update(_this.now);
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

        this.createPhaser = function(phases) {
            var phaser = new UpdatePhaser(guid(), phases);
            this.phasers.push(phaser);
            return phaser;
        };

        this.resizeCanvas = function() {
            /* TODO: Remember the map should be resized to the new client width/height too */
        };
    }

    Snaps.util = util;

    return Snaps;
});
