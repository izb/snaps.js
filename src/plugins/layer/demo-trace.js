/*global define*/
define(['util/js'], function(js) {

    'use strict';

    var copyProps = js.copyProps;

    var sn;

    /* A sample layer effect that shows collisions for testing. TODO: Delete this please */

    /**
     * @param {Object} opts Parameters for customizing the layer. Requires these properties:
     * 'x' and 'y' The center of the scan.
     */
    function DemoTrace(layerName, opts) {
        this.opts = opts||{};
        this.name = layerName;
        this.x = opts.x;
        this.y = opts.y;

        this.collider = sn.createCollider('circle-trace', {radius:opts.radius});
    }

    DemoTrace.prototype.update = function(now) {
    };

    DemoTrace.prototype.draw = function(ctx, now) {

        var endW = [0,0];
        var startS = [0,0];
        var limit = [0,0];
        var i,dx,dy,collisionRatio;

        for (i = -200; i < 200; i+=8) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            sn.mouseWorldPos(endW);

            dx = endW[0]+i - this.x;
            dy = endW[1] - this.y;
            collisionRatio = this.collider.test(
                    Math.floor(this.x),
                    Math.floor(this.y),
                    Math.floor(dx),
                    Math.floor(dy),
                    0,
                    limit);
            sn.worldToScreenPos(limit[0], limit[1], limit);

            sn.worldToScreenPos(this.x, this.y, startS);
            ctx.moveTo(startS[0], startS[1]);
            ctx.lineTo(limit[0], limit[1]);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = collisionRatio<1?'red':'green';
            ctx.arc(limit[0],limit[1],2.5,0,2*Math.PI);
            ctx.stroke();
        }

        for (i = -200; i < 200; i+=8) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            sn.mouseWorldPos(endW);

            dx = endW[0] - this.x;
            dy = endW[1]+i - this.y;
            collisionRatio = this.collider.test(
                    Math.floor(this.x),
                    Math.floor(this.y),
                    Math.floor(dx),
                    Math.floor(dy),
                    0,
                    limit);
            sn.worldToScreenPos(limit[0], limit[1], limit);

            sn.worldToScreenPos(this.x, this.y, startS);
            ctx.moveTo(startS[0], startS[1]);
            ctx.lineTo(limit[0], limit[1]);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = collisionRatio<1?'red':'green';
            ctx.arc(limit[0],limit[1],2.5,0,2*Math.PI);
            ctx.stroke();
        }
    };

    DemoTrace.prototype.set = function(newconf) {
        copyProps(newconf, this);
    };

    return function(snaps) {
        sn = snaps;
        sn.registerLayerPlugin('demo-trace', DemoTrace, function(){});
    };

});
