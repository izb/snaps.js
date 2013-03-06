define(function() {

    'use strict';

    var pos = [0,0];
    var sn;

    /** Called with the sprite as the 'this' context.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var followMouse = function() {

        this.sn.mouseWorldPos(pos);
        this.x = pos[0];
        this.y = pos[1];
        return true;
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('follow_mouse', followMouse, function(){});
    };

});
