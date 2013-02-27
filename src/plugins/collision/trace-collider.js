define(function() {

    'use strict';

    function TraceCollider(opts, sn) {
        this.opts = opts;
        this.sn = sn;

        /* TODO: Whisker range option */

        /* TODO: Do something */
    }

    /** The mighty Bresenham's line drawing algorithm.
     * Parameters MUST be integers.
     */
    TraceCollider.prototype.trace = function(x0, y0, dx, dy){
        var x1 = x0 + dx;
        var y1 = y0 + dy;
        dx = Math.abs(dx);
        dy = Math.abs(dy);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;

        while(true){
            if(this.sn.getTilePropAtWorldPos('solid',x0,y0)==='1') {
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

        return {x:x0, y:y0};
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
