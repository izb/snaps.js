define(function() {

    'use strict';

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
        /* TODO: Collision test */
        this.x=tx;
        this.y=ty;
        if (th!==undefined) {
            this.h=th;
        }
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
