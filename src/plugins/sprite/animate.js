define(function() {

    'use strict';

    var sn;

    function Animate() {

    }

    /*
     * Example options:
     *
     * updates:[{
     *     name:'animate'
     *     tween:'easeInOutCubic',
     *     props: {
     *         x: 20,
     *         y: 30
     *     },
     *     duration: 1000
     * }]
     *
     * Means the x and y properties of the sprite will adjusted by 20,30
     * over 1000ms with the easing in and out.
     *
     * If duration is omited, it will be calculated automatically from the
     * maxloops lifespan of the sprite
     */

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
    Animate.prototype.update = function(now, phaseOn) {
        var s = this.sprite;
        var t = now - this.epoch;
        for(var prop in this.props) {
            s[prop] = this.tweenfn(t, this.begin[prop], this.props[prop], this.duration);
        }
        return true;
    };

    /** Called with the update options as the 'this' context, one of which
     * is this.sprite, which refers to the sprite being updated.
     */
    Animate.prototype.init = function() {
        var s = this.sprite;
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

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('animate', Animate);
    };

});
