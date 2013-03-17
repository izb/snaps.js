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

        var xslip = 0;

        if (this.autoSlip) {

            /* In isometric maps, we want to ensure that the player
             * can slip more easily along walls without getting
             * caught on pixel jaggies. To do this, we watch for certain
             * pixel patterns and make subtle adjustments to the
             * lines traced. */

            var localmask;
            var r = dx/dy;

            if (r>=2&&r<=3) {
                /* nw/se */
                localmask = localScan(sn, x0, y0, 'height',h);
                if (localmask===23) {
                    xslip = -1;
                } else if (localmask===232) {
                    xslip = 1;
                }
            } else if (r<=-2&&r>=-3) {
                /* sw/ne */
                localmask = localScan(sn, x0, y0, 'height',h);
                if (localmask===240) {
                    xslip = -1;
                } else if (localmask===15) {
                    xslip = 1;
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
            h, xslip, out);
    };

    return function(snaps) {
        sn = snaps;
        sn.registerColliderPlugin('line-trace', LineTrace, function(){});
    };

});
