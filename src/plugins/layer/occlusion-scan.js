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
        var endS = [0,0];
        var startS = [0,0];
        var pocW = [0,0];

        for (var i = -200; i < 200; i++) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'red';
            ctx.beginPath();
            var startW = _this.testLine[1];
            this.sn.worldToScreenPos(startW.x, startW.y, startS);
            this.sn.mouseWorldPos(endW);
            this.sn.worldToScreenPos(endW[0]+i, endW[1], endS);

            var dx = endW[0]+i - startW.x;
            var dy = endW[1] - startW.y;
            var collided = this.collider.trace(
                    Math.floor(startW.x),
                    Math.floor(startW.y),
                    Math.floor(dx),
                    Math.floor(dy),
                    pocW);
            var pocS = [0,0];
            this.sn.worldToScreenPos(pocW[0], pocW[1], pocS);

            ctx.moveTo(startS[0], startS[1]);
            ctx.lineTo(pocS[0], pocS[1]);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = 'green';
            ctx.arc(pocS[0],pocS[1],5,0,2*Math.PI);
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
