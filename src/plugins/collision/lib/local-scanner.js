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

    return localScan;
});
