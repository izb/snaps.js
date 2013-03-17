define(function() {

    'use strict';

    var traceProp = function(sn, prop, edges, x0, y0, dx, dy, h, out){

        var i;


        var ox0 = x0;
        var oy0 = y0;
        var odx = dx;
        var ody = dy;

        var sampleHeight;

        var x1 = (x0 + dx)|0;
        var y1 = (y0 + dy)|0;

        x0=x0|0;
        y0=y0|0;
        dx = Math.abs(x1-x0);
        dy = Math.abs(y1-y0);

        if (dx === 0 && dy === 0) {
            out[0] = x0;
            out[1] = y0;
            sampleHeight = sn.getTilePropAtWorldPos(prop,x0,y0);
            return (sampleHeight>h);
        }

        /* The mighty Bresenham's line algorithm */
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;

        var collided = false;
        var x0clear = x0;
        var y0clear = y0;

        /* Skip the first pixel, we can assume it's good. */
        var e2 = 2*err;
        if (e2 >-dy){
            err -= dy;
            x0  += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0  += sy;
        }


        while(true){
            if (x0<edges.le || x0>edges.re || y0<edges.te || y0> edges.be) {
                collided = true;
                break;
            }

            sampleHeight = sn.getTilePropAtWorldPos(prop,x0,y0);

            if(sampleHeight>h) {
                collided = true;
                break;
            }

            x0clear = x0;
            y0clear = y0;

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

    return traceProp;
});
