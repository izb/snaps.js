/*global define*/
define(['util/js', 'sprites/sprite'], function(js, Sprite) {

    'use strict';

    /**
     * @module sprites/composite
     */

    var copyProps = js.copyProps;
    var clone = js.clone;


    /**
     * Construct a composite sprite. Do not call this constructor directly; you should instead call
     * <code>sn.createComposite()</code> on the engine.
     * <p>
     * A composite is a collection of sprites that can be manipulated as one. They share the same plane
     * which means they are more efficient. A composite has x, y, but no h position, but the sprites within
     * it behave as though they have x and h but no y position (y is ignored within a composite).
     * @constructor module:sprites/composite.Composite
     * @param {Object} sn The engine reference
     * @param {Number} x X position in the world for the composite.
     * @param {Number} y Y position in the world for the composite.
     * @param {String} id A unique identifier.
     * @param {Function} [endCallback] Once the composite and all its child sprites expire, this is called.
     */
    function Composite(sn, x, y, id, endCallback) {
        /* TODO: Passing an ID in here is smelly. I think. Or perhaps it's ok coz it requires
         * a factory method to call this. I dunno. */
        this.sn = sn;
        this.x = x;
        this.y = y;
        this.endCallback = endCallback;
        this.active = true;
        this.sprites = [];
    }

    /**
     * Initialize the composite before use.
     * @method module:sprites/composite.Composite#init
     * @private
     */
    Composite.prototype.init = function() {
        /* TODO: Initialize composite plugins */
    };


    /**
     * Add a sprite to the composite.
     * @method module:sprites/composite.Composite#addSprite
     * @param defName The name of the sprite definition to use. These are
     * set up in your game's spriteDefs data.
     * @param stateName The initial state. This too is defined in the
     * sprite's definition, in your game's spriteDefs data.
     * @param {Number} x The world x coordinate. If a function, it should take
     * no parameters and return a number.
     * @param {Number} y The world y coordinate. If a function, it should take
     * no parameters and return a number.
     * @param {Number} h The height off the ground. If a function, it should take
     * no parameters and return a number.
     * @param {Object} [opts] For a list of parameters
     * see the opts parameter on the {@link module:sprites/sprite.Sprite|Sprite class constructor}.
     */
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

    /** Tests to see if this is an active composite. Inactive composites will be destroyed by the
     * engine. If any child sprites are active, this will be active.
     * @method module:sprites/composite.Composite#isActive
     * @param {Number} now Current frame timestamp
     * @return {Boolean} True if active
     */
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

    /**
     * @private
     * @method module:sprites/composite.Composite#update
     */
    Composite.prototype.update = function(now, fnEach) {
        /* TODO: Call composite plugins */
        for (var i = this.sprites.length - 1; i >= 0; i--) {
            if (fnEach!==undefined) {
                fnEach(this.sprites[i], now);
            }
            this.sprites[i].update();
        }
    };

    /**
     * @private
     * @method module:sprites/composite.Composite#draw
     */
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

    /**
     * @private
     * @method module:sprites/composite.Composite#onRemove
     */
    Composite.prototype.onRemove = function() {
        for (var i = this.sprites.length - 1; i >= 0; i--) {
            this.sprites[i].onRemove();
        }
    };

    return Composite;

});
