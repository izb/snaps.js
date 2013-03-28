/*global define*/
define(function() {

    /**
     * Returns an array of 0-centered sample points for an ellipse
     * using a variant of the midpoint circle algorithm.
     * HT http://geofhagopian.net/sablog/Slog-october/slog-10-25-05.htm
     * @param  {Number} rx The x radius. Pass an integer please.
     * @param  {Number} ry The y radius. Pass an integer please.
     * @return {Array} In the form [x0,y0,x1,y1...]. The points do
     * not describe a continuous path, but is complete.
     */
    return function(rx,ry) {
        var rx2 = rx * rx;
        var ry2 = ry * ry;
        var twoa2 = 2 * rx2;
        var twob2 = 2 * ry2;
        var p;
        var x = 0;
        var y = ry;
        var px = 0;
        var py = twoa2 * y;

        var s = [];

        /* Initial point in each quadrant. */
        s.push(x,y,-x,y,x,-y,-x,-y);

        /* Region 1 */
        p = Math.round (ry2 - (rx2 * ry) + (0.25 * rx2));
        while (px < py) {
            x++;
            px += twob2;
            if (p < 0) {
                p += ry2 + px;
            } else {
                y--;
                py -= twoa2;
                p += ry2 + px - py;
            }
            s.push(x,y,-x,y,x,-y,-x,-y);
        }

        /* Region 2 */
        p = Math.round (ry2 * (x+0.5) * (x+0.5) + rx2 * (y-1) * (y-1) - rx2 * ry2);
        while (y > 0) {
            y--;
            py -= twoa2;
            if (p > 0) {
                p += rx2 - py;
            } else {
                x++;
                px += twob2;
                p += rx2 - py + px;
            }
            s.push(x,y,-x,y,x,-y,-x,-y);
        }
        return s;
    };
});
