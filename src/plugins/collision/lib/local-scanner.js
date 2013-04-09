/*global define*/
define(function() {

    'use strict';

    var ySlip = function(sn, x0, y0, h, dx, dy) {
        var localmask;
        var r = dx/dy;

        if (r>=2&&r<=3) {

            /* nw/se */

            if (sn.getTilePropAtWorldPos('height',x+1,y-1)>h &&    //  .##
                    sn.getTilePropAtWorldPos('height',x,y-1)>h &&  //  .o#
                    sn.getTilePropAtWorldPos('height',x+1,y)>h) {  //  ...

                /* Technically we should test that our shifted y position is not solid,
                 * but really if you are using collision maps that look like that then
                 * you're asking for trouble. */
                return 1;

            } else if(sn.getTilePropAtWorldPos('height',x-1,y+1)>h &&  //  ...
                    sn.getTilePropAtWorldPos('height',x-1,y)>h &&      //  #o.
                    sn.getTilePropAtWorldPos('height',x,y+1)>h) {      //  ##.

                return -1;
            }

        } else if (r<=-2&&r>=-3) {

            /* sw/ne */

            if (sn.getTilePropAtWorldPos('height',x+1,y+1)>h &&    //  ...
                    sn.getTilePropAtWorldPos('height',x,y+1)>h &&  //  .o#
                    sn.getTilePropAtWorldPos('height',x+1,y)>h) {  //  .##

                return -1;

            } else if(sn.getTilePropAtWorldPos('height',x-1,y-1)>h &&  //  ##.
                    sn.getTilePropAtWorldPos('height',x-1,y)>h &&      //  #o.
                    sn.getTilePropAtWorldPos('height',x,y-1)>h) {      //  ...

                return 1;
            }
        }

        return 0;
    };

    return {
        ySlip:ySlip
    };
});
