define(function() {

    /*
     * Wide trace is a naive, broken and deprecated circular trace. It has problems dealing with
     * sampling rounding errors and getting moving sprites trapped in solid walls.
     * You probably want circle-trace instead.
     *
     * TODO: Remove this code once it's exhausted its use as a reference script.
     *
     */

    'use strict';

    var sn;

    function WideTrace(opts) {
        opts = opts||{};
        this.sn = sn;

        if (opts.whisker===undefined || opts.whisker===0) {
            throw "Wide trace requires a whisker radius >0 in its options.";
        }

        this.whisker = opts.whisker;
        this.sampleCount = opts.samples?opts.samples:7;
        this.samples = new Array(2*this.sampleCount);
        if (this.sampleCount<3||(this.sampleCount&1)===0) {
            throw "Trace collider sample count must be an odd number 3 or higher";
        }

        var edges = sn.getScreenEdges();
        this.leftEdge = edges.le;
        this.rightEdge = edges.re;
        this.topEdge = edges.te;
        this.bottomEdge = edges.be;
    }

    var doTrace = function(x0, y0, dx, dy, h, out){

        this.sampled = []; /* TODO: Remove this. It's only used to collect points for plotting on the screen to aid dev */

        var i;

        var w = this.whisker;

        var ox0 = x0;
        var oy0 = y0;
        var odx = dx;
        var ody = dy;
        var leadx,leady;

        var sampleHeight;

        if (dx === 0 && dy === 0) {
            out[0] = x0;
            out[1] = y0;
            sampleHeight = this.sn.getTilePropAtWorldPos('height',x0,y0);
            return (sampleHeight>h);
        }

        var nwx,nwy;

        var dy2 = dy*2;
        var len = Math.sqrt((dx*dx) + (dy2*dy2));
        nwx = dx/len;
        nwy = dy/len;
        dx = (dx+w*nwx)|0;
        dy = (dy+w*nwy)|0;
        var a = Math.atan2(dy*2, dx) - Math.PI/2;
        var astep = Math.PI/(this.sampleCount-1);
        var mid = Math.floor(this.sampleCount/2)*2;
        for (i = 0; i < this.sampleCount*2; i+=2) {
            var cs = Math.cos(a);
            var sn = Math.sin(a);

            this.samples[i] = (w* cs)|0;
            this.samples[i+1] = (w*sn/2)|0;

            if (i===mid) {
                leadx=this.samples[i];
                leady=this.samples[i+1];
            }

            a+=astep;
        }
        for (i = 0; i < this.sampleCount*2; i+=2) {
            this.samples[i] = this.samples[i]-leadx;
            this.samples[i+1] = this.samples[i+1]-leady;
        }

        var x1 = x0 + dx;
        var y1 = y0 + dy;
        dx = Math.abs(dx);
        dy = Math.abs(dy);

        /* The mighty Bresenham's line algorithm */
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;

        var found = false;
        var collided = false;
        var x0clear = x0;
        var y0clear = y0;

        var absleadx = Math.abs(leadx);
        var absleady = Math.abs(leady);

        var e2;


        while(true){
            if (Math.abs(x0-ox0)>=absleadx && Math.abs(y0-oy0)>=absleady) {

                found = false;
                for (i = 0; i < this.samples.length; i+=2) {
                    var sx0 = x0+this.samples[i];
                    var sy0 = y0+this.samples[i+1];

                    if (sx0<this.leftEdge || sx0>this.rightEdge || sy0<this.topEdge || sy0> this.bottomEdge) {
                        collided = true;
                        found = true;
                        break;
                    }

                    sampleHeight = this.sn.getTilePropAtWorldPos('height',sx0,sy0);

                    this.sampled.push(sx0);
                    this.sampled.push(sy0);

                    if(sampleHeight>h||sampleHeight===undefined) {
                        collided = true;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    x0clear = x0;
                    y0clear = y0;
                }

            }

            if (found) {
                break;
            }

            if ((x0===x1) && (y0===y1)) {
                break;
            }

            e2 = 2*err;

            if (e2 >-dy){
                err -= dy;
                x0  += sx;
            }

            if (e2 < dx) {
                err += dx;
                y0  += sy;
            }
        }

        if (collided) {
            /* Move the limit point to the centre, not the whisker tip. */
            x0clear-=leadx;
            y0clear-=leady;

            if (out!==undefined) {
                out[0] = x0clear;
                out[1] = y0clear;
            }
        } else if (out!==undefined) {
            out[0] = ox0+odx;
            out[1] = oy0+ody;
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
    WideTrace.prototype.test = function(x0, y0, dx, dy, h, out){
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
        sn.registerColliderPlugin('wide-trace', WideTrace, function(){});
    };

});
