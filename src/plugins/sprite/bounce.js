/*global define*/
define(function() {

    'use strict';

    var sn;

    /**
     * @module plugins/sprite/bounce
     */

    /**
     * A simple way to make a sprite bounce by adjusting its height property. The sprite will bounce
     * with a duration matching the current state's animation.
     * <p>
     * Note that this should not be constructed directly, but rather via the updates or commit
     * property in your spawnSprite data, e.g. <code>update:[{name:'bounce'}]</code>.
     * <p>
     * Alongside the name, you can pass the following options
     * <dl>
     *  <dt>bounce_height</dt><dd>How high it should bounce in pixels.</dd>
     *  <dt>bounce_base</dt><dd>Where is the 'floor'? E.g. a bounce_base of 25 and an bounce height
     *  of 100 will bounce up 100px on top of the floor level of 25. The height value will
     *  be 125 at its apex, midway through the state animation.</dd>
     * </dl>
     * @constructor module:plugins/sprite/bounce.Bounce
     */
    function Bounce() {

    }

    /** Called with the sprite as the function context.
     * @method module:plugins/sprite/bounce.Bounce#update
     * @private
     * @param  {Number} now The time of the current frame
     * @param  {Boolean} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    Bounce.prototype.update = function(now, phaseOn) {
        var s = this.sprite;
        var b = s.state.jogPos(s.epoch, sn.getNow()); /* 0..1 */
        b*=2;
        b-=1;
        b*=b;

        s.h = this.bounce_base + this.bounce_height * (1-b);
        return true;
    };

    /**
     * @method module:plugins/sprite/bounce.Bounce#init
     * @private
     */
    Bounce.prototype.init = function(sprite) {
        this.sprite = sprite;
    };

    /**
     * @method module:plugins/sprite/bounce.Bounce#onSpriteRemoved
     * @private
     */
    Bounce.prototype.onSpriteRemoved = function() {
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('bounce', Bounce);
    };

});
