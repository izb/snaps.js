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

    var doTrace = function(x0, y0, dx, dy, out) {

        var w = this.whisker;

        var ox0 = x0;
        var oy0 = y0;
        var odx = dx;
        var ody = dy;

        var result;
        if (dx === 0 && dy === 0) {
            out[0] = x0;
            out[1] = y0;
            result = this.sn.getTilePropAtWorldPos('solid',x0,y0);
            return (result==='1'||result===undefined);
        }

        var nwx,nwy;
        if (w!==undefined) {
            var len = Math.sqrt((dx*dx) + (dy*dy));
            nwx = dx/len;
            nwy = dy/len;
            dx = Math.floor(dx+w*nwx);
            dy = Math.floor(dy+w*nwy);
        }

        var x1 = x0 + dx;
        var y1 = y0 + dy;
        dx = Math.abs(dx);
        dy = Math.abs(dy);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;

        /* The mighty Bresenham's line algorithm */
        var collided = false;
        while(true){
            result = this.sn.getTilePropAtWorldPos('solid',x0,y0);

            if(result==='1'||result===undefined) {
                collided = true;
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

        if (w!==undefined) {
            var cdx = nwx*w;
            var cdy = nwy*w;
            var hcdy = cdy*2;
            var wlen = Math.sqrt((cdx*cdx) + (hcdy*hcdy));
            cdx = cdx/wlen;
            cdy = cdy/wlen;
            /* Move the POC to the centre, not the whisker tip. */
            x0-=(cdx*w);
            y0-=(cdy*w);
        }

        if (collided && out !==undefined) {
            if (out!==undefined) {
                out[0] = x0;
                out[1] = y0;
            }

            if (dx>dy) {
                return (ox0-x0)/(-odx);
            } else {
                return (oy0-y0)/(-ody);
            }
        } else if (out!==undefined) {
            out[0] = ox0+odx;
            out[1] = oy0+ody;
        }
        return 1;
    };

    /** Perform a trace to test for collision along a line.
     * @param  {Array} out An optional 2-length array which will recieve the
     * point of contact. You can interpret this as the position to which the
     * character can go along its path at which it will be touching a solid
     * object. If there is no collision, the output position will be the
     * desired new position.
     * @return {Boolean} True if there was a collision.
     */
    TraceCollider.prototype.test = function(x0, y0, dx, dy, out){
        var ratio = doTrace.call(this, x0, y0, dx, dy, out);
        return ratio<1;
    };

    return function(sn) {
        sn.registerColliderPlugin('trace', TraceCollider, function(){});
    };

});
