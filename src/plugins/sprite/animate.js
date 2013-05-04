/*global define*/
define(function() {

    'use strict';

    var sn;

    /**
     * @module plugins/sprite/animate
     */

    /**
     * A sprite updater that animates one or more properties on the sprite. Properties are modified
     * directly, so handle with care. Be aware that property updates on things such as position will bypass
     * the automatic direction setting you'd get if you had called Sprite#move.
     * <p>
     * Note that this should not be constructed directly, but rather via the updates or commit
     * property in your spawnSprite data, e.g. <code>updates:[{name:'animate'}]</code>.
     * <p>
     * Alongside the name, you can pass the following options
     * <dl>
     *  <dt>tween</dt><dd>The name of the tween function. See the tweens module for a full list of options.</dd>
     *  <dt>props</dt><dd>An object describing the properties to adjust. Values are relative adjustments, not
     *     absolute values. E.g.
     *     <pre>
     *     props: {
     *         x: 20,
     *         y: 30
     *     }
     *     </pre>
     *     Will increase x by 20 and y by 30.
     *     </dd>
     *  <dt>duration</dt><dd>The duration of the tween in milliseconds. If omitted, the duration will
     *      be automatically calculated from the maxloops lifespan of the sprite. The tweener assumes
     *      from this that the state will not change.</dd>
     * </dl>
     * @constructor module:plugins/sprite/animate.Animate
     */
    function Animate() {
        /* TODO: Docs - link to tweens functions. */
        /* TODO: Docs - link to sprite move function. */
    }


    /** Called with the update options as the function context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @method module:plugins/sprite/animate.Animate#update
     * @private
     * @param  {Number} now The time of the current frame
     * @param  {Boolean} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    Animate.prototype.update = function(now, phaseOn) {
        var s = this.sprite;
        var t = now - this.epoch;
        for(var prop in this.props) {
            s[prop] = this.tweenfn(t, this.begin[prop], this.props[prop], this.duration);
        }
        return true;
    };

    /**
     * @method module:plugins/sprite/animate.Animate#init
     * @private
     */
    Animate.prototype.init = function(s) {
        this.sprite = s;
        if (this.duration===undefined) {
            /* If duration is omitted, take the sprite duration in its current state. */
            this.duration = s.maxDuration();
        }

        this.begin = {};
        for(var prop in this.props) {
            this.begin[prop] = s[prop];
        }

        /* Guard against /0 in tweens with a trivial minimum duration. 1ms will be guaranteed
         * to have expired on the next frame. */
        this.duration = Math.max(this.duration, 1);

        if (!sn.tweens.hasOwnProperty(this.tween)) {
            throw "Unrecognized tween in animate plugin: "+this.tween;
        }

        /* Turn the name into a fn */
        this.tweenfn = sn.tweens[this.tween];

        this.epoch = sn.getNow();
    };

    /**
     * @method module:plugins/sprite/animate.Animate#onSpriteRemoved
     * @private
     */
    Animate.prototype.onSpriteRemoved = function() {
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('animate', Animate);
    };

});
