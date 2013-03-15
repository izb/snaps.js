define(function() {

    'use strict';

    var sn;

    function LineTrace() { /* Options passed are ignored. */
        this.sn = sn;

        var edges = sn.getScreenEdges();
        this.leftEdge = edges.le;
        this.rightEdge = edges.re;
        this.topEdge = edges.te;
        this.bottomEdge = edges.be;
    }

    var doTrace = function(x0, y0, dx, dy, h, out){

        var i;

        var ox0 = x0;
        var oy0 = y0;
        var odx = dx;
        var ody = dy;

        var sampleHeight;

        if (dx === 0 && dy === 0) {
            out[0] = x0;
            out[1] = y0;
            sampleHeight = this.sn.getTilePropAtWorldPos('height',x0,y0);
            return (sampleHeight>h);
        }

        var x1 = x0 + dx;
        var y1 = y0 + dy;
        dx = Math.abs(dx);
        dy = Math.abs(dy);

        /* The mighty Bresenham's line algorithm */
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;

        var collided = false;
        var x0clear = x0;
        var y0clear = y0;

        /* Skip the first pixel, we can assume it's good. */
        var e2 = 2*err;
        if (e2 >-dy){
            err -= dy;
            x0  += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0  += sy;
        }

        while(true){
            if (x0<this.leftEdge || x0>this.rightEdge || y0<this.topEdge || y0> this.bottomEdge) {
                collided = true;
                break;
            }

            sampleHeight = this.sn.getTilePropAtWorldPos('height',x0,y0);

            if(sampleHeight>h) {
                collided = true;
                break;
            }

            x0clear = x0;
            y0clear = y0;

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


        if (collided) {
            if (out!==undefined) {
                out[0] = x0clear;
                out[1] = y0clear;
            }
        } else if (out!==undefined) {
            out[0] = ox0+odx;
            out[1] = oy0+ody;
        }
        return collided;
    };


    /** Perform a trace to test for collision along a line.
     * @param  {Array} out An optional 2-length array which will recieve the
     * point of contact. You can interpret this as the position to which the
     * character can go along its path at which it will be touching a solid
     * object. If there is no collision, the output position will be the
     * desired new position.
     * @return {Boolean} True if there was a collision.
     */
    LineTrace.prototype.test = function(x0, y0, dx, dy, h, out){
        /* Ensuring integers always go in via this wrapper ensures that
         * V8 won't back out runtime optimisations of the code. */
        return doTrace.call(this,
            (x0)|0,
            (y0)|0,
            (dx)|0,
            (dy)|0,
            h, out);
    };

    return function(snaps) {
        sn = snaps;
        sn.registerColliderPlugin('line-trace', LineTrace, function(){});
    };

});
