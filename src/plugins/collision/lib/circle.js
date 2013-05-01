/*global define*/
define(function() {

    /**
     * @module plugins/collision/lib/circle
     * @private
     */

    /**
     * Returns an array of 0-centered sample points for a circle
     * using the midpoint circle algorithm.
     * @function module:plugins/collision/lib/circle#circle
     * @param  {Number} r The radius. Pass an integer please.
     * @return {Array} In the form <code>[x0,y0,x1,y1...]</code>. The points do
     * not describe a continuous path, but is complete.
     */
    return function(r) {
        var x = 0;
        var y = r;
        var p = 3 - 2 * r;

        var s = [];

        while (y >= x)
        {
            s.push(
                -x, -y,
                -y, -x,
                 y, -x,
                 x, -y,
                -x,  y,
                -y,  x,
                 y,  x,
                 x,  y);

            if (p < 0) {
                p += 4*x++ + 6;
            } else {
                p += 4*(x++ - y--) + 10;
            }
         }

         return s;
    };
});
