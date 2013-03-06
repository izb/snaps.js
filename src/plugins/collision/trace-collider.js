define(function() {

    'use strict';

    var sn;

    function TraceCollider(opts) {
        opts = opts||{};
        this.sn = sn;

        if (opts.whisker>0) {
            this.whisker = opts.whisker;
            this.sampleCount = opts.samples?opts.samples:7;
            if (this.sampleCount<3||(this.sampleCount&1)===0) {
                throw "Trace collider sample count must be an odd number 3 or higher";
            }
        } else {
            this.whisker = 0;
        }

        var edges = sn.getScreenEdges();
        this.leftEdge = edges.le;
        this.rightEdge = edges.re;
        this.topEdge = edges.te;
        this.bottomEdge = edges.be;
    }

    var doTrace = function(x0, y0, dx, dy, h, out) {

        var i;

        var w = this.whisker;

        var ox0 = x0;
        var oy0 = y0;
        var odx = dx;
        var ody = dy;

        var result;
        if (dx === 0 && dy === 0) {
            out[0] = x0;
            out[1] = y0;
            result = this.sn.getTilePropAtWorldPos('height',x0,y0);
            return (result>h);
        }

        var nwx,nwy,samples;
        if (w>0) {
            var dy2 = dy*2;
            var len = Math.sqrt((dx*dx) + (dy2*dy2));
            nwx = dx/len;
            nwy = dy/len;
            dx = Math.floor(dx+w*nwx);
            dy = Math.floor(dy+w*nwy);
            samples = new Array(2*this.sampleCount);
            var a = Math.atan2(dy*2, dx) - Math.PI/2;
            var astep = Math.PI/(this.sampleCount-1);
            var mid = Math.floor(this.sampleCount/2)*2;
            var leadx,leady;
            for (i = 0; i < this.sampleCount*2; i+=2) {
                var cs = Math.cos(a);
                var sn = Math.sin(a);

                samples[i] = w* cs;
                samples[i+1] = w*sn/2;
                if (i===mid) {
                    leadx=samples[i];
                    leady=samples[i+1];
                }
                a+=astep;
            }
            for (i = 0; i < this.sampleCount*2; i+=2) {
                samples[i] = samples[i]-leadx;
                samples[i+1] = samples[i+1]-leady;
            }
        }

        var x1 = x0 + dx;
        var y1 = y0 + dy;
        dx = Math.abs(dx);
        dy = Math.abs(dy);

        /* The mighty Bresenham's line algorithm */
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;

        var found, collided = false;
        while(true){
            if (w===0) {
                if (x0<this.leftEdge || x0>this.rightEdge || y0<this.topEdge || y0> this.bottomEdge) {
                    collided = true;
                    break;
                }
                result = this.sn.getTilePropAtWorldPos('height',x0,y0);

                if(result>h) {
                    collided = true;
                    break;
                }
            } else {
                found = false;
                for (i = 0; i < samples.length; i+=2) {
                    var sx0 = x0+samples[i];
                    var sy0 = y0+samples[i+1];

                    if (sx0<this.leftEdge || sx0>this.rightEdge || sy0<this.topEdge || sy0> this.bottomEdge) {
                        collided = true;
                        found = true;
                        break;
                    }

                    result = this.sn.getTilePropAtWorldPos('height',sx0,sy0);

                    if(result>h||result===undefined) {
                        collided = true;
                        found = true;
                        break;
                    }
                }
            }

            if (found) {
                break;
            }

            if ((x0===x1) && (y0===y1)) {
                break;
            }

            var e2 = 2*err;

            if (e2 >-dy){
                err -= dy;
                x0  += sx;
            }

            if (e2 < dx) {
                err += dx;
                y0  += sy;
            }
        }

        if (w>0 && collided) {
            /* Move the limit point to the centre, not the whisker tip. */
            x0-=(nwx*w);
            y0-=(nwy*w);
        }

        if (collided && out !==undefined) {
            if (out!==undefined) {
                out[0] = x0;
                out[1] = y0;
            }

            if (dx>dy) {
                return (ox0-x0)/(-odx);
            } else {
                return (oy0-y0)/(-ody);
            }
        } else if (out!==undefined) {
            out[0] = ox0+odx;
            out[1] = oy0+ody;
        }
        return 1;
    };

    /** Perform a trace to test for collision along a line.
     * @param  {Array} out An optional 2-length array which will recieve the
     * point of contact. You can interpret this as the position to which the
     * character can go along its path at which it will be touching a solid
     * object. If there is no collision, the output position will be the
     * desired new position.
     * @return {Boolean} True if there was a collision.
     */
    TraceCollider.prototype.test = function(x0, y0, dx, dy, h, out){
        var ratio = doTrace.call(this, x0, y0, dx, dy, h, out);
        return ratio<1;
    };

    return function(snaps) {
        sn = snaps;
        sn.registerColliderPlugin('trace', TraceCollider, function(){});
    };

});
