/*global define*/
define(function() {

    'use strict';

    var sn;

    function ApplyVelocity() {

    }

    /* TODO: Stupid bug. This exists so that the flock plugin calculates all the
     * velocities in place first, then the velocities are applied to the sprites
     * afterwards. Of course this is stupid. This plugin is called immediately
     * after the flock plugin on a per-sprite basis. Duh.
     * To fix, we need to have post-update updates. Try not to make it look messy. */

    /*
     * Example options:
     *
     * updates:[{
     *     name:'applyvelocity',
     *     on_collision: function() {
     *         // React to collision
     *     }
     * }]
     *
     * TODO: Pass collision ratio to the collision callback
     *
     * on_collision is an optional collision callback, called with the sprite as the
     * function context.
     *
     */

    /** Called with the sprite as the function context.
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
        if(s.move(s.velocityx, s.velocityy) && this.on_collision!==undefined) {
            this.on_collision.call(s);
        }
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
