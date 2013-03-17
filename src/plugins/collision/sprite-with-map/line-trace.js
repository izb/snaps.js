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

    LineTrace.prototype.setup = function(s, dx, dy){

        if (!this.autoSlip) {
            return;
        }

        var localmask;
        var r = dx/dy;

        /* First, distance ourself from key jaggies shapes in key directions,
         * to ensure the player can slip past isometric lines without getting
         * caught on pixels. */
        if (r>=2&&r<=3) {
            /* nw/se */
            localmask = localScan(sn, s.x, s.y, 'height',s.h);
            if (localmask===23) {
                s.y=s.y+1;
            } else if (localmask===232) {
                s.y=s.y-1;
            }
        } else if (r<=-2&&r>=-3) {
            /* sw/ne */
            localmask = localScan(sn, s.x, s.y, 'height',s.h);
            if (localmask===240) {
                s.y=s.y-1;
            } else if (localmask===15) {
                s.y=s.y+1;
            }
        }
        /* TODO: Crap, how will this work on circle scan? :( */

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
