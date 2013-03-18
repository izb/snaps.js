define([
    'plugins/collision/lib/prop-scanner',
    'plugins/collision/lib/circle',
    'plugins/collision/lib/local-scanner'],
function(traceProp, midPtCircle, localScan) {

    'use strict';

    var sn;

    var ySlip = localScan.ySlip;

    function CircleTrace(opts) {

        opts = opts||{};
        this.sn = sn;

        if (opts.radius===undefined || opts.radius===0) {
            throw "Circle trace requires a radius >0 in its options.";
        }

        this.edges = sn.getScreenEdges();

        this.samples = midPtCircle(opts.radius|0);

        console.log("Circle has "+this.samples.length/2+" samples");

        this.lineHit = [0,0];

        if (opts.autoSlip===undefined) {
            this.autoSlip = true;
            /* TODO: This should default to true ONLY for isometric maps. */
        } else {
            this.autoSlip = opts.autoSlip;
        }
    }



    /** Perform a trace to test for collision along a line with radius.
     * Effectively traces an ellipse  from one point to another, with some
     * important performance compromises in accuracy.
     * @param  {Array} out An optional 2-length array which will recieve the
     * point of contact. You can interpret this as the position to which the
     * character can go along its path at which it will be touching a solid
     * object. If there is no collision, the output position will be the
     * desired new position.
     * @return {Boolean} True if there was a collision.
     */
    CircleTrace.prototype.test = function(x0, y0, dx, dy, h, out){


        if (this.autoSlip) {
            /* First, distance ourself from key jagged shapes in key directions,
             * to ensure the player can slip past isometric lines without getting
             * caught on pixels. */
            y0 += ySlip(sn, x0, y0, h, dx, dy);
        }

        var collisionRatio = traceProp(sn,
            'height',
            this.edges,
            x0,
            y0,
            dx,
            dy,
            h, this.lineHit);


        if (collisionRatio<1) {
            /* TODO: Trace backwards with the circle to find the rest point. */
            out[0] = this.lineHit[0];
            out[1] = this.lineHit[1];
        } else {
            out[0] = this.lineHit[0];
            out[1] = this.lineHit[1];
        }

        return collisionRatio;
    };

    return function(snaps) {
        sn = snaps;
        sn.registerColliderPlugin('circle-trace', CircleTrace, function(){});
    };

});
