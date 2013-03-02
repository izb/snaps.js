define(['util/js'], function(js) {

    'use strict';

    var copyProps = js.copyProps;

    /* A sample layer effect that performs collision traces to approximate a circular
     * occlusion scan. Just pretty, not (yet) useful. */

    /**
     * @param {Object} opts Parameters for customizing the layer. Requires these properties:
     * 'x' and 'y' The center of the scan.
     */
    function OcclusionScan(layerName, opts, sn) {
        this.opts = opts||{};
        this.name = layerName;
        this.x = opts.x;
        this.y = opts.y;
        this.sn = sn;
        this.collider = sn.createCollider('trace', {whisker:opts.whisker});
    }

    /** FX plugin callbacks should return true to continue, or false if complete.
     * @return {Boolean} See description
     */
    OcclusionScan.prototype.update = function(now) {
    };

    OcclusionScan.prototype.draw = function(ctx, now) {

        var endW = [0,0];
        var startS = [0,0];
        var poc = [0,0];

        for (var i = -200; i < 200; i+=2) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            this.sn.mouseWorldPos(endW);

            var dx = endW[0]+i - this.x;
            var dy = endW[1] - this.y;
            var collided = this.collider.trace(
                    Math.floor(this.x),
                    Math.floor(this.y),
                    Math.floor(dx),
                    Math.floor(dy),
                    poc);
            this.sn.worldToScreenPos(poc[0], poc[1], poc);

            this.sn.worldToScreenPos(this.x, this.y, startS);
            ctx.moveTo(startS[0], startS[1]);
            ctx.lineTo(poc[0], poc[1]);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = collided?'red':'green';
            ctx.arc(poc[0],poc[1],5,0,2*Math.PI);
            ctx.stroke();
        }
    };

    OcclusionScan.prototype.set = function(newconf) {
        copyProps(newconf, this);
    };

    return function(sn) {
        sn.registerLayerPlugin('occlusion-scan', OcclusionScan, function(){});
    };

});
