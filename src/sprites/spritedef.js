/*global define*/
define(function() {

    'use strict';

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
