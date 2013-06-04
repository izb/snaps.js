/*global define*/
define(function() {

    'use strict';

    var sn;

    /**
     * @module plugins/sprite/track
     */

    /**
     * A plugin that gets triggered whenever a sprite's position changes.
     * <p>
     * Note that this should not be constructed directly, but rather via the updates or commit
     * property in your spawnSprite data, e.g. <code>update:[{name:'track'}]</code>.
     * <p>
     * See The <code>opts<code> parameter in the {@link module:sprites/sprite.Sprite|Sprite constructor}
     * <p>
     * Alongside the name, you can pass the following options
     * <dl>
     *  <dt>fn</dt><dd>A function to call whenever the position changes. If the position hasn't
     *    changed since the last frame, this function will not be called. The function is of the
     *    form
     *    <pre>
     *    function(sprite) {
     *        // track sprite
     *    }
     *    </pre>
     *    </dd>
     *  <dt>register</dt><dd>A function to call when the sprite is registered with this plugin.
     *  The function is of the form
     *    <pre>
     *    function(sprite) {
     *        // register sprite
     *    }
     *    </pre>
     *    </dd>
     *  <dt>deregister</dt><dd>A function to call when the sprite is removed from the stage.
     *  The function is of the form
     *    <pre>
     *    function(sprite) {
     *        // deregister sprite
     *    }
     *    </pre>
     *    </dd>
     *  <dt>always</dt><dd>A function to call on every frame, regardless of whether the position
     *    changed. If you specify this and <code>fn</code> together, then fn will be called first.
     *    <pre>
     *    function(sprite, hasMoved) {
     *        // track sprite
     *    }
     *    </pre>
     *    </dd>
     * </dl>
     * The register and deregister functions are useful when combined with the
     * {@link module:ai/proximity-tracker.ProximityTracker|ProximityTracker}
     * to track large numbers of autonomous sprites. See
     * {@link module:ai/proximity-tracker.ProximityTracker|ProximityTracker.track} for
     * an example of how to set that up.
     * @constructor module:plugins/sprite/track.Track
     */
    function Track() {
    }

    /** Called with the update options as the function context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @method module:plugins/sprite/track.Track#update
     * @private
     * @param  {Number} now The time of the current frame
     * @param  {Boolean} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    Track.prototype.update = function(now, phaseOn) {

        var s = this.sprite;

        var moved = (s.x!==this.x || s.y!==this.y || s.h!==this.h);

        if (moved) {
            if (this.fn) {
                this.fn(s);
            }
            this.x=s.x;
            this.y=s.y;
            this.h=s.h;
        }

        if (this.always) {
            this.always(s, moved);
        }

        return true;
    };

    /**
     * @method module:plugins/sprite/track.Track#onSpriteRemoved
     * @private
     */
    Track.prototype.onSpriteRemoved = function() {
        if (this.deregister) {
            this.deregister(this.sprite);
        }
    };

    /**
     * @method module:plugins/sprite/track.Track#init
     * @private
     */
    Track.prototype.init = function(s) {
        this.sprite = s;
        this.x=s.x;
        this.y=s.y;
        this.h=s.h;
        if (this.register) {
            this.register(s);
        }
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('track', Track);
    };

});
