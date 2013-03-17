define(['plugins/collision/lib/local-scanner'], function(localScan) {

    'use strict';

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

        this.collisionPoint = [0,0];
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
                if(!this.updates[i].update(now)) {
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
    Sprite.prototype.moveTo = function(tx,ty,th) {
        if (th!==undefined) {
            th=th-this.h;
        }

        this.move(tx-this.x,ty-this.y,th);
    };

    /** Move a sprite by a given amount, taking collision into account.
     * If there is a collision, the sprite will be moved to the point of collision.
     * @param  {Number} dx Amount to alter x position
     * @param  {Number} dy Amount to alter y position
     * @param  {Number} dh Optional; Amount to alter height
     */
    Sprite.prototype.move = function(dx,dy,dh) {

        if (!(dx||dy||dh)) {
            return;
        }

        if (this.collider!==undefined) {
            this.collider.setup(this,dx,dy);

            if(this.collider.test(this.x, this.y, dx,dy,this.h,this.collisionPoint)) {
                this.x = this.collisionPoint[0];
                this.y = this.collisionPoint[1];

                this.directionx = this.x + dx;
                this.directiony = this.y + dy;
                /* TODO: Move dh by a proportion of the path travelled? */
                return;
            }
        }

        this.x=this.x+dx;
        this.y=this.y+dy;

        this.directionx = this.x + dx;
        this.directiony = this.y + dy;
        if (dh!==undefined) {
            this.h+=dh;
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
                (this.x - offsetx - this.def.x)|0,
                (this.y - offsety - this.def.y - this.h)|0,
                now);
    };

    return Sprite;

});
