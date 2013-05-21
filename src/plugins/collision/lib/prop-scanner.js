/*global define*/
define(function() {

    'use strict';

    /**
     * @module plugins/collision/lib/prop-scanner
     * @private
     */

    /**
     * Trace along a path in a line, sampling a given property until it breaches
     * some limit. AKA a linear collision trace.
     * @function module:plugins/collision/lib/prop-scanner#traceProp
     * @param  {Object} sn Engine reference
     * @param  {String} prop  The property to sample. Normally 'height'
     * @param  {Object} edges A description of the world edges. See
     * {@link module:map/staggered-isometric.StaggeredIsometric#getWorldEdges|getWorldEdges}
     * @param  {Number} x0    Starting point x world coordinate
     * @param  {Number} y0    Starting point y world coordinate
     * @param  {Number} dx    Desired X movement
     * @param  {Number} dy    Desired Y movement
     * @param  {Number} h     Property limit. If prop is > h, it's a collision
     * @param  {Array} out   Spanned array of length 2 that will receive the colllision point.
     * Point will be written as <code>[x,y]</code>. If there is no collision, the output point
     * will be the destination point.
     * @param  {Array} route A spanned array in the form <code>[x,y,x,y,x,y...]</code> that
     * will receive the pixels traced along the line up to the point of collision. If the array had
     * any contents before being passed in, it will be destroyed.
     * @return {Number} The ratio of the path completed before collision. 1 indicates no collision.
     * <1 indicates a collision, e.g. 0.8 means it got 80% along the desired path before colliding.
     */
    var traceProp = function(sn, prop, edges, x0, y0, dx, dy, h, out, route){

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

        var routeidx = 0;
        if (route!==undefined) {
            route.length = 0;
            route.length = 2*(Math.max(dx, dy)+1);
        }

        if (dx === 0 && dy === 0) {
            out[0] = x0;
            out[1] = y0;
            return 1;
        }

        /* The mighty Bresenham's line algorithm */
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;

        var collided = false;
        var x0clear = x0;
        var y0clear = y0;

        /* Skip the first pixel, we can assume it's good. */
        if (route!==undefined) {
            route[routeidx++] = x0;
            route[routeidx++] = y0;
        }

        var e2 = 2*err;
        if (e2 >-dy){
            err -= dy;
            x0  += sx; /* Skippity */
        }
        if (e2 < dx) {
            err += dx;
            y0  += sy; /* Skip */
        }

        while(true){
            if (x0<edges.le || x0>edges.re || y0<edges.te || y0> edges.be) {
                collided = true;
                break;
            }

            sampleHeight = sn.getTilePropsAtWorldPos(prop,x0,y0);

            if(sampleHeight>h) {
                collided = true;
                break;
            }

            x0clear = x0;
            y0clear = y0;

            if (route!==undefined) {
                route[routeidx++] = x0;
                route[routeidx++] = y0;
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

        /* Populate the output final point for the caller */
        if (collided) {
            if (out!==undefined) {
                out[0] = x0clear;
                out[1] = y0clear;
            }
        } else if (out!==undefined) {
            out[0] = ox0+odx;
            out[1] = oy0+ody;
        }

        if (route!==undefined) {
            route.length = routeidx;
        }

        /* No collision indicated by 1 in returned collision ratio */
        if (!collided) {
            return 1;
        }

        /* Return a ratio of path completed, e.g. 0.5 means half of the path
         * was traversed before being stopped by collision. */
        if (dx>dy) {
            return (out[0]-ox0)/odx;
        } else {
            return (out[1]-oy0)/ody;
        }
    };

    return traceProp;
});
