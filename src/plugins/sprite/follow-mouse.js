define(function() {

    'use strict';

    var pos = [0,0];
    var sn;

    /** Called with the update options as the 'this' context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var followMouse = function(now) {

        sn.mouseWorldPos(pos);
        var s = this.sprite;
        s.x = pos[0];
        s.y = pos[1];
        return true;
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('follow_mouse', followMouse, function(){});
    };

});
