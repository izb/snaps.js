define(function() {

    'use strict';

    var pos = [0,0];
    var sn;

    function FollowMouse() {

    }

    /** Called with the update options as the 'this' context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @param  {Number} now The time of the current frame
     * @param  {Bool} phaseOn If the sprite is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    FollowMouse.prototype.update = function(now, phaseOn) {

        sn.mouseWorldPos(pos);
        var s = this.sprite;
        s.x = pos[0];
        s.y = pos[1];
        return true;
    };

    FollowMouse.prototype.init = function() {
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('follow_mouse', FollowMouse);
    };

});
