/*global define*/
define(function() {

    'use strict';

    var sn;

    function ApplyVelocity() {

    }

    /*
     * Example options:
     *
     * updates:[{
     *     name:'applyvelocity'
     * }]
     *
     */

    /** Called with the sprite as the 'this' context.
     * @param  {Number} now The time of the current frame
     * @param  {Bool} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    ApplyVelocity.prototype.update = function(now, phaseOn) {
        var s = this.sprite;
        s.move(s.velocityx, s.velocityy);
        return true;
    };

    ApplyVelocity.prototype.init = function(sprite) {
        this.sprite = sprite;
    };

    ApplyVelocity.prototype.onSpriteRemoved = function() {
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('apply-velocity', ApplyVelocity);
    };

});
