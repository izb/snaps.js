define(function() {

    'use strict';

    /** Called with the sprite as the 'this' context.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var followMouse = function() {

        var pos = this.eng.mouseWorldPos();
        this.x = pos.x;
        this.y = pos.y;
        return true;
    };

    return function(eng) {
        eng.registerSpriteUpdater('follow_mouse', followMouse, function(){});
    };

});
