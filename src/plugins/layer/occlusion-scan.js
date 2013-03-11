define(['util/js'], function(js) {

    'use strict';

    var copyProps = js.copyProps;

    var sn;

    /* A sample layer effect that performs collision traces to approximate a circular
     * occlusion scan. Just pretty, not (yet) useful. */

    /**
     * @param {Object} opts Parameters for customizing the layer. Requires these properties:
     * 'x' and 'y' The center of the scan.
     */
    function OcclusionScan(layerName, opts) {
        this.opts = opts||{};
        this.name = layerName;
        this.x = opts.x;
        this.y = opts.y;
        this.collider = sn.createCollider('trace2', {whisker:opts.whisker});
    }

    OcclusionScan.prototype.update = function(now) {
    };

    OcclusionScan.prototype.draw = function(ctx, now) {

        var endW = [0,0];
        var startS = [0,0];
        var limit = [0,0];
        var i,dx,dy,collided;

        for (i = -200; i < 200; i+=8) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            this.sn.mouseWorldPos(endW);

            dx = endW[0]+i - this.x;
            dy = endW[1] - this.y;
            collided = this.collider.test(
                    Math.floor(this.x),
                    Math.floor(this.y),
                    Math.floor(dx),
                    Math.floor(dy),
                    0,
                    limit);
            this.sn.worldToScreenPos(limit[0], limit[1], limit);

            this.sn.worldToScreenPos(this.x, this.y, startS);
            ctx.moveTo(startS[0], startS[1]);
            ctx.lineTo(limit[0], limit[1]);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = collided?'red':'green';
            ctx.arc(limit[0],limit[1],2.5,0,2*Math.PI);
            ctx.stroke();
        }

        for (i = -200; i < 200; i+=8) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            this.sn.mouseWorldPos(endW);

            dx = endW[0] - this.x;
            dy = endW[1]+i - this.y;
            collided = this.collider.test(
                    Math.floor(this.x),
                    Math.floor(this.y),
                    Math.floor(dx),
                    Math.floor(dy),
                    0,
                    limit);
            this.sn.worldToScreenPos(limit[0], limit[1], limit);

            this.sn.worldToScreenPos(this.x, this.y, startS);
            ctx.moveTo(startS[0], startS[1]);
            ctx.lineTo(limit[0], limit[1]);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = collided?'red':'green';
            ctx.arc(limit[0],limit[1],2.5,0,2*Math.PI);
            ctx.stroke();
        }
    };

    OcclusionScan.prototype.set = function(newconf) {
        copyProps(newconf, this);
    };

    return function(snaps) {
        sn = snaps;
        sn.registerLayerPlugin('occlusion-scan', OcclusionScan, function(){});
    };

});
