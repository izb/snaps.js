define(function() {

    'use strict';

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
