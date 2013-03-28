/*global define*/
define(function() {

    'use strict';

    /** Returns a bitmask representing the local pixels around a point, and how
     * solid they are.
     *
     * +-----------------+
     * |  1  |  2  |  4  |
     * +-----------------+
     * |  8  |  Pt |  16 |
     * +-----------------+
     * |  32 |  64 | 128 |
     * +-----------------+
     *
     * Where Pt is the sampled point
     */
    var localScan = function(sn, x, y, prop,limit){

        var scanmask = sn.getTilePropAtWorldPos(prop,x+1,y+1)>limit;
        scanmask = scanmask<<1|sn.getTilePropAtWorldPos(prop,x,y+1)>limit;
        scanmask = scanmask<<1|sn.getTilePropAtWorldPos(prop,x-1,y+1)>limit;
        scanmask = scanmask<<1|sn.getTilePropAtWorldPos(prop,x+1,y)>limit;
        scanmask = scanmask<<1|sn.getTilePropAtWorldPos(prop,x-1,y)>limit;
        scanmask = scanmask<<1|sn.getTilePropAtWorldPos(prop,x+1,y-1)>limit;
        scanmask = scanmask<<1|sn.getTilePropAtWorldPos(prop,x,y-1)>limit;
        scanmask = scanmask<<1|sn.getTilePropAtWorldPos(prop,x-1,y-1)>limit;

        return scanmask;
    };

    var ySlip = function(sn, x0, y0, h, dx, dy) {
        var localmask;
        var r = dx/dy;

        if (r>=2&&r<=3) {
            /* nw/se */
            localmask = localScan(sn, x0, y0, 'height',h);
            if (localmask===23) {
                return 1;
            } else if (localmask===232) {
                return -1;
            }
        } else if (r<=-2&&r>=-3) {
            /* sw/ne */
            localmask = localScan(sn, x0, y0, 'height',h);
            if (localmask===240) {
                return -1;
            } else if (localmask===15) {
                return 1;
            }
        }

        return 0;
    };

    return {
        localScan:localScan,
        ySlip:ySlip
    };
});
