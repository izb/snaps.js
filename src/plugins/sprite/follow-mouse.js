/*global define*/
define(function() {

    'use strict';

    var pos = [0,0];
    var sn;

    /**
     * @module plugins/sprite/follow-mouse
     */

    /**
     * A simple way to make a sprite track the mouse position.
     * <p>
     * Note that this should not be constructed directly, but rather via the updates or commit
     * property in your spawnSprite data, e.g. <code>update:[{name:'follow_mouse'}]</code>.
     * <p>
     * This plugin takes no options.
     * @constructor module:plugins/sprite/follow-mouse.FollowMouse
     */
    function FollowMouse() {

    }

    /** Called with the update options as the function context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @method module:plugins/sprite/follow-mouse.FollowMouse#update
     * @private
     * @param  {Number} now The time of the current frame
     * @param  {Boolean} phaseOn If the update is controlled by a phaser,
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

    /**
     * @method module:plugins/sprite/follow-mouse.FollowMouse#init
     * @private
     */
    FollowMouse.prototype.init = function(sprite) {
        this.sprite = sprite;
    };

    /**
     * @method module:plugins/sprite/follow-mouse.FollowMouse#onSpriteRemoved
     * @private
     */
    FollowMouse.prototype.onSpriteRemoved = function() {
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('follow_mouse', FollowMouse); /* TODO: Underscores are inconsistent */
    };

});
