/*global define*/
define(function() {

    'use strict';

    /**
     * @module sprites/spritedef
     * @private
     */

    /**
     * @private
     * @constructor module:sprites/spritedef.State
     * @param {Array} seq Image offset sequence in the form
     * [[x0,y0],[x1,y1],[x2,y2]...]
     */
    function State(seq, dur, def) {
        this.seq = seq;
        this.dur = dur;
        this.def = def;
    }

    /**
     * @method module:sprites/spritedef.State#jogPos
     * @private
     */
    State.prototype.jogPos = function(epoch, now) {
        var dt = now - epoch;
        dt = dt % this.dur;
        return dt / this.dur;
    };

    /**
     * @method module:sprites/spritedef.State#draw
     * @private
     */
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
                x|0, y|0,
                def.w, def.h
            );
    };

    /**
     * @private
     * @constructor module:sprites/spritedef.SpriteDef
     */
    function SpriteDef(image, w, h, x, y) {
        this.states = {};
        this.image = image;
        this.w = w;
        this.h = h;

        /*hotspot...*/
        this.x = x;
        this.y = y;
    }

    /**
     * @private
     * @method module:sprites/spritedef.SpriteDef#addState
     */
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

    /**
     * Test to see if a state exists in this definition.
     * @method module:sprites/spritedef.SpriteDef#hasState
     * @param  {String} state The state to test for
     * @return {Boolean} true if it exists.
     * @private
     */
    SpriteDef.prototype.hasState = function(state) {
        return this.states.hasOwnProperty(state);
    };

    /**
     * @private
     * @method module:sprites/spritedef.SpriteDef#aliasState
     */
    SpriteDef.prototype.aliasState = function(alias, state) {
        var s = this.states[state];
        /* TODO: Validate */
        this.states[alias] = s;
    };

    return SpriteDef;

});
