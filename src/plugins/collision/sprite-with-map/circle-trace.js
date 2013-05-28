/*global define*/
define([
    'plugins/collision/lib/prop-scanner',
    'plugins/collision/lib/ellipse',
    'plugins/collision/lib/local-scanner'],
function(traceProp, midPtEllipse, localScan) {

    'use strict';

    /**
     * @module plugins/collision/sprite-with-map/circle-trace
     */

    var sn;

    var ySlip = localScan.ySlip;

    /**
     * Creates a circle tracer that traces a circle (An on-screen elipse in isometric-land)
     * along a path to detect collision.
     * Note that this should not be constructed directly, but rather via the plugin factory method
     * {@link module:snaps.Snaps#createCollider|createCollider} on the engine.
     * @constructor module:plugins/collision/sprite-with-map/circle-trace.CircleTrace
     * @param {Object} opts An object with assorted options set in it.
     * <dl>
     *  <dt>radius</dt><dd>The radius must be >0 and describes the x radius of the elipse as
     *  projected on-screen.</dd>
     *  <dt>autoSlip</dt><dd>Defaults to true for isometric maps. If set, the collision trace
     *  will 'slip' away from jagged pixel edges to prevent sprites from being caught up in
     *  jaggies when moving at isometric angles. In unsure, omit this property to use the
     *  default.</dd>
     * </dl>
     */
    function CircleTrace(opts) {

        opts = opts||{};
        this.sn = sn;

        if (opts.radius===undefined || opts.radius===0) {
            throw "Circle trace requires a radius >0 in its options.";
        }

        this.radius  = opts.radius;

        this.edges   = sn.getWorldEdges();

        /* We call this a circle trace, but we use a half-height ellipse
         * to represent the perspective distortion of the isometric
         * map. */
        this.samples = midPtEllipse(opts.radius|0, opts.radius/2|0);

        this.lineHit = [0,0];

        if (opts.autoSlip===undefined) {
            this.autoSlip = true;
            /* TODO: This should default to true ONLY for isometric maps. */
            /* TODO: Note in manual that autoslip is only useful for main player characters
             * that walk parallel to walls and that switching it off may improve performance
             * in certain circumstances. */
            /* TODO: Perhaps we should switch it off my default? */
        } else {
            this.autoSlip = opts.autoSlip;
        }
    }

    /** Perform a trace to test for collision along a line with radius.
     * Effectively traces an ellipse  from one point to another, with some
     * important performance compromises in accuracy.
     * @method module:plugins/collision/sprite-with-map/circle-trace.CircleTrace#test
     * @param  {Number} x0  World X position of the starting point
     * @param  {Number} y0  World Y position of the starting point
     * @param  {Number} dx  Amount to move in the X axis
     * @param  {Number} dy  Amount to move in the Y axis
     * @param  {Number} h   Tile pixel height considered the ground (non-collision)
     * @param  {Array} out An optional 2-length array which will recieve the
     * point of contact. You can interpret this as the position to which the
     * character can go along its path at which it will be touching a solid
     * object. If there is no collision, the output position will be the
     * desired new position.
     * @return {Number} A number from 0-1 representing how far along the route
     * the trace managed to get. 1 means no collision.
     */
    CircleTrace.prototype.test = function(x0, y0, dx, dy, h, out){

        var sxo, syo, i;

        /* TODO: Some evidence seems to show that the code actually runs slightly slower with
         * this code in place. Investigate this. */
        /* TODO: I don't actually think there's any reason to overload this function
         * so much. Perhaps duplicate and tweak it? */
        var safeDist = sn.worldToTilePos(x0, y0, this.lineHit);
        var xdx = Math.abs(dx)+this.radius;
        var xdy = Math.abs(dy/2)+this.radius/2;
        if (xdx*xdx+xdy*xdy<=safeDist*safeDist) {
            /* Trivial non-collision case */
            /* TODO: There may be an issue if height is involved. */
            out[0] = x0+dx;
            out[1] = y0+dy;
            return 1;
        }

        if (this.autoSlip) {
            /* First, distance ourself from key jagged shapes in key directions,
             * to ensure the player can slip past isometric lines without getting
             * caught on pixels. */
            var slip = 0;
            for (i = this.samples.length - 2; i >= 0; i-=2) {
                sxo = this.samples[i];
                syo = this.samples[i+1];
                var newslip = ySlip(sn, x0+sxo, y0+syo, h, dx, dy);

                if (slip===0) {
                    slip = newslip;
                } else if(newslip!==0 && slip!==newslip) {
                    slip = 0;
                    break;
                }
            }
            y0+=slip;
        }

        var route = []; /* Route will be populated with non-collision positions
                         * along the path. */
        var collisionRatio = traceProp(sn,
            'height',
            this.edges,
            x0, y0,
            dx, dy,
            h, this.lineHit, route);

        var routeidx = route.length - 2;
        var rx, ry;

        /* Trace backwards with the circle to find the rest point. */
        var collided = true;
        for (i = route.length - 2; i >= 2 && collided; i-=2) {
            collided = false;
            for (var j = this.samples.length - 2; j >= 0; j-=2) {
                sxo = this.samples[j];
                syo = this.samples[j+1];
                rx = route[i];
                ry = route[i+1];

                var sampleHeight = sn.getTilePropsAtWorldPos('height',rx+sxo,ry+syo);

                if(sampleHeight>h) {
                    collided = true;
                    break;
                }
            }
            if (!collided) {
                if (i===route.length-2) {
                    /* Clear to the end/linear collision */
                    out[0] = this.lineHit[0];
                    out[1] = this.lineHit[1];
                    return collisionRatio;
                } else {
                    /* Clear to part-way along */
                    out[0] = rx;
                    out[1] = ry;
                    if (dx>dy) {
                        return (rx-x0)/dx;
                    } else {
                        return (ry-y0)/dy;
                    }
                }
            }
        }

        if (route.length===2&&collisionRatio===1) {
            out[0] = x0+dx;
            out[1] = y0+dy;
            return 1;
        }

        out[0] = x0;
        out[1] = y0;
        return 0;
    };

    return function(snaps) {
        sn = snaps;
        sn.registerColliderPlugin('circle-trace', CircleTrace);
    };

});
