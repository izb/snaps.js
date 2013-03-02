define(function() {

    'use strict';

    function TraceCollider(opts, sn) {
        opts = opts||{};
        this.sn = sn;

        if (opts.whisker>0) {
            this.whisker = opts.whisker;
        }

        /* TODO: Whisker range option */

        /* TODO: Do something */
    }

    /** The mighty Bresenham's line drawing algorithm.
     * Parameters MUST be integers.
     */
    TraceCollider.prototype.trace = function(x0, y0, dx, dy, out){

        var result;
        if (dx === 0 && dy === 0) {
            out[0] = x0;
            out[1] = y0;
            result = this.sn.getTilePropAtWorldPos('solid',x0,y0);
            return (result==='1'||result===undefined);
        }

        if (this.whisker!==undefined) {
            var len = Math.sqrt((dx*dx) + (dy*dy));
            dx = Math.floor(dx+this.whisker*dx/len);
            dy = Math.floor(dy+this.whisker*dy/len);
        }

        var x1 = x0 + dx;
        var y1 = y0 + dy;
        dx = Math.abs(dx);
        dy = Math.abs(dy);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;

        var collided = false;
        while(true){
            result = this.sn.getTilePropAtWorldPos('solid',x0,y0);

            if(result==='1'||result===undefined) {
                collided = true;
                out[0] = x0;
                out[1] = y0;
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

        out[0] = x0;
        out[1] = y0;
        return collided;
    };

    /** FX plugin callbacks should return true to continue, or false if complete.
     * Should be called with context set to the sprite.
     * @return {Boolean} See description
     */
    TraceCollider.prototype.test = function(x,y,dx,dy) {

        return false;
    };

    return function(sn) {
        sn.registerColliderPlugin('trace', TraceCollider, function(){});
    };

});
