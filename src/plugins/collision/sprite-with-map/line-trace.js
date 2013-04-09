/*global define*/
define([
    'plugins/collision/lib/prop-scanner',
    'plugins/collision/lib/local-scanner'],
function(traceProp, localScan) {

    'use strict';

    var sn;

    var ySlip = localScan.ySlip;

    function LineTrace(opts) {
        opts = opts || {};
        this.sn = sn;
        this.edges = sn.getWorldEdges();
        this.xy = [0,0];

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

        /* TODO: I don't actually think there's any reason to overload this function
         * so much. Perhaps duplicate and tweak it? */
        var safeDist = this.worldToTilePos = function(x, y, this.xy);
        if (dx*dx+dy*dy<=safeDist*safeDist) {
            /* Trivial non-collision case */
            /* TODO: There may be an issue if height is involved. */
            out[0] = x0+dx;
            out[1] = y0+dy;
            return false;
        }


        if (this.autoSlip) {
            /* First, distance ourself from key jagged shapes in key directions,
             * to ensure the player can slip past isometric lines without getting
             * caught on pixels. */
            y0 += ySlip(sn, x0, y0, h, dx, dy);
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
