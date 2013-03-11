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
        for (var i = 0; i < this.updates.length; i++) {
            this.updates[i].sprite = this;
        }
        this.endCallback = endCallback;
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
        if (maxloops===0) {
            return 0;
        }
        return this.state.dur * this.maxloops;
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
                if(!this.updates[i].fn()) {
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
     * @param  {Number} tx Target x world position
     * @param  {Number} ty Target y world position
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
