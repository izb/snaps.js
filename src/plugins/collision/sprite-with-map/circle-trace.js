define(['plugins/collision/lib/prop-scanner'], function(traceProp) {

    'use strict';

    var sn;

    function CircleTrace(opts) {
        opts = opts||{};
        this.sn = sn;

        if (opts.radius===undefined || opts.radius===0) {
            throw "Circle trace requires a radius >0 in its options.";
        }

        this.radius = opts.radius;
        this.sampleCount = opts.samples?opts.samples:7;
        this.samples = new Array(2*this.sampleCount);
        if (this.sampleCount<3||(this.sampleCount&1)===0) {
            throw "Trace collider sample count must be an odd number 3 or higher";
        }

        this.edges = sn.getScreenEdges();

        this.lineHit = [0,0];
    }


    var doTrace = function(x0, y0, dx, dy, h, out){

        /* Ensuring integers always go in via this wrapper ensures that
         * V8 won't back out runtime optimisations of the code. */
        var collided = traceProp(sn,
            'height',
            this.edges,
            (x0)|0,
            (y0)|0,
            (dx)|0,
            (dy)|0,
            h, 0, out);

        if (collided) {
            /* TODO: Trace backwards with the circle to find the rest point. */
            out[0] = this.lineHit[0];
            out[0] = this.lineHit[0];
        } else {
            out[0] = this.lineHit[0];
            out[0] = this.lineHit[0];
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
    CircleTrace.prototype.test = function(x0, y0, dx, dy, h, out){
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
        sn.registerColliderPlugin('circle-trace', CircleTrace, function(){});
    };

});
