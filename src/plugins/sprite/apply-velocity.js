/*global define*/
define(function() {

    'use strict';

    var sn;

    /**
     * @module plugins/sprite/apply-velocity
     */

    /**
     * A sprite updater that simply takes the velocityx and velocityy properties on the sprite and
     * applies it to the position via {@link module:sprites/sprite.Sprite#move|move}. This is useful
     * in situations where another plugin is updating valocities but those velocities depend upon
     * the momentary positions of sprites. E.g. you have a flock update which updates velocity.
     * In that case you would have this plugin as a commit to apply the velocity calculated by flock.
     * <p>
     * Snaps runs all sprite updates first, then runs all sprite commits.
     * <p>
     * Note that this should not be constructed directly, but rather via the updates or commit
     * property in your spawnSprite data, e.g. <code>commit:[{name:'apply-velocity'}]</code>.
     * <p>
     * See The <code>opts<code> parameter in the {@link module:sprites/sprite.Sprite|Sprite constructor}
     * <p>
     * Alongside the name, you can pass the following options
     * <dl>
     *  <dt>on_collision</dt><dd>An optional function that is called if the sprite could not
     *  be moved to it's target position due to collision. This function will be called with the
     *  sprite as the function context.</dd>
     * </dl>
     * @constructor module:plugins/sprite/apply-velocity.ApplyVelocity
     */
    function ApplyVelocity() {
        /* TODO: Pass collision ratio to the collision callback */
    }


    /** Called with the sprite as the function context.
     * @method module:plugins/sprite/apply-velocity.ApplyVelocity#update
     * @private
     * @param  {Number} now The time of the current frame
     * @param  {Boolean} phaseOn If the update is controlled by a phaser,
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

    /**
     * @method module:plugins/sprite/apply-velocity.ApplyVelocity#init
     * @private
     */
    ApplyVelocity.prototype.init = function(sprite) {
        this.sprite = sprite;
    };

    /**
     * @method module:plugins/sprite/apply-velocity.ApplyVelocity#onSpriteRemoved
     * @private
     */
    ApplyVelocity.prototype.onSpriteRemoved = function() {
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('apply-velocity', ApplyVelocity);
    };

});
