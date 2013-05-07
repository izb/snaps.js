/*global define*/
define([
    'plugins/collision/lib/prop-scanner',
    'plugins/collision/lib/local-scanner'],
function(traceProp, localScan) {

    'use strict';

    var sn;

    /**
     * @module plugins/collision/sprite-with-map/line-trace
     */

    var ySlip = localScan.ySlip;

    /**
     * Creates a tracer that traces a line along a path to detect collision.
     * Note that this should not be constructed directly, but rather via the plugin factory method
     * <code>sn.createCollider('line-trace')</code> on the engine.
     * @constructor module:plugins/collision/sprite-with-map/line-trace.LineTrace
     * @param {Object} opts An object with assorted options set in it.
     * <dl>
     *  <dt>autoSlip</dt><dd>Defaults to true for isometric maps. If set, the collision trace
     *  will 'slip' away from jagged pixel edges to prevent sprites from being caught up in
     *  jaggies when moving at isometric angles. In unsure, omit this property to use the
     *  default.</dd>
     * </dl>
     */
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
     * @method module:plugins/collision/sprite-with-map/line-trace.LineTrace#test
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
    LineTrace.prototype.test = function(x0, y0, dx, dy, h, out){

        /* TODO: I don't actually think there's any reason to overload this function
         * so much. Perhaps duplicate and tweak it? */
        var safeDist = sn.worldToTilePos(x0, y0, this.xy);
        if (dx*dx+dy*dy<=safeDist*safeDist) {
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
        sn.registerColliderPlugin('line-trace', LineTrace);
    };

});
