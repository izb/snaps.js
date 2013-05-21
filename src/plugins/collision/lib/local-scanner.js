/*global define*/
define(function() {

    'use strict';

    /**
     * @module plugins/collision/lib/local-scanner
     * @private
     */

    /**
     * For a given point and angle of movement, this function determines whether
     * the start point should be nudged up or down a pixel in order to compensate
     * for the possibility of getting caught on jagged pixel edges. The nudged value
     * should be passed into a collision tracer instead of the true value.
     * @function module:plugins/collision/lib/local-scanner#ySlip
     * @param  {Object} sn Engine reference
     * @param  {Number} x  Start point x world position
     * @param  {Number} y  Start point y world position
     * @param  {Number} h  Level height. Anything above this is solid.
     * @param  {Number} dx Amount we'd like to move in x direction
     * @param  {Number} dy Amount we'd like to move in y direction
     * @return {Number} 0, 1 or -1 as the amount to nudge the starting y position.
     */
    var ySlip = function(sn, x, y, h, dx, dy) {
        var localmask;
        var r = dx/dy;

        if (r>=2&&r<=3) {

            /* nw/se */

            if (sn.getTilePropsAtWorldPos('height',x+1,y-1)>h &&    //  .##
                    sn.getTilePropsAtWorldPos('height',x,y-1)>h &&  //  .o#
                    sn.getTilePropsAtWorldPos('height',x+1,y)>h) {  //  ...

                /* Technically we should test that our shifted y position is not solid,
                 * but really if you are using collision maps that look like that then
                 * you're asking for trouble. */
                return 1;

            } else if(sn.getTilePropsAtWorldPos('height',x-1,y+1)>h &&  //  ...
                    sn.getTilePropsAtWorldPos('height',x-1,y)>h &&      //  #o.
                    sn.getTilePropsAtWorldPos('height',x,y+1)>h) {      //  ##.

                return -1;
            }

        } else if (r<=-2&&r>=-3) {

            /* sw/ne */

            if (sn.getTilePropsAtWorldPos('height',x+1,y+1)>h &&    //  ...
                    sn.getTilePropsAtWorldPos('height',x,y+1)>h &&  //  .o#
                    sn.getTilePropsAtWorldPos('height',x+1,y)>h) {  //  .##

                return -1;

            } else if(sn.getTilePropsAtWorldPos('height',x-1,y-1)>h &&  //  ##.
                    sn.getTilePropsAtWorldPos('height',x-1,y)>h &&      //  #o.
                    sn.getTilePropsAtWorldPos('height',x,y-1)>h) {      //  ...

                return 1;
            }
        }

        return 0;
    };

    return {
        ySlip:ySlip
    };
});
