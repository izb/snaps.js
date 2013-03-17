define([
    'plugins/collision/lib/prop-scanner',
    'plugins/collision/lib/local-scanner'],
function(traceProp, localScan) {

    'use strict';

    var sn;

    function LineTrace(opts) {
        opts = opts || {};
        this.sn = sn;
        this.edges = sn.getScreenEdges();

        if (opts.autoSlip===undefined) {
            this.autoSlip = true;
            /* TODO: This should default to true ONLY for isometric maps. */
        } else {
            this.autoSlip = opts.autoSlip;
        }
    }


    /** Perform a trace to test for collision along a line.
     * @param  {Array} out An optional 2-length array which will recieve the
     * point of contact. You can interpret this as the position to which the
     * character can go along its path at which it will be touching a solid
     * object. If there is no collision, the output position will be the
     * desired new position.
     * @return {Boolean} True if there was a collision.
     */
    LineTrace.prototype.test = function(x0, y0, dx, dy, h, out){

        if (this.autoSlip) {
            var localmask;
            var r = dx/dy;

            /* First, distance ourself from key jaggies shapes in key directions,
             * to ensure the player can slip past isometric lines without getting
             * caught on pixels. */
            if (r>=2&&r<=3) {
                /* nw/se */
                localmask = localScan(sn, x0, y0, 'height',h);
                if (localmask===23) {
                    y0=y0+1;
                } else if (localmask===232) {
                    y0=y0-1;
                }
            } else if (r<=-2&&r>=-3) {
                /* sw/ne */
                localmask = localScan(sn, x0, y0, 'height',h);
                if (localmask===240) {
                    y0=y0-1;
                } else if (localmask===15) {
                    y0=y0+1;
                }
            }
        }

        return traceProp(sn,
            'height',
            this.edges,
            x0,
            y0,
            dx,
            dy,
            h, out);
    };

    return function(snaps) {
        sn = snaps;
        sn.registerColliderPlugin('line-trace', LineTrace, function(){});
    };

});
