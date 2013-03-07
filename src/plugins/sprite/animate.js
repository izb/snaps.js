define(function() {

    'use strict';

    var sn;

    /*
     * Example options:
     *
     * opts:{
     *     tween:'easeInOutCubic',
     *     props: {
     *         x: 20,
     *         y: 30
     *     },
     *     duration: 1000
     * }
     *
     * Means the x and y properties of the sprite will adjusted by 20,30
     * over 1000ms with the specified easing.
     *
     * If duration is omited, it will be calculated automatically from the
     * maxloops lifespan of the sprite (TODO).
     */

    /** Called with the sprite as the 'this' context.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var animate = function() {
        /* TODO: actually tween */
        return true;
    };

    /** Called with the sprite as the 'this' context.
     */
    var init = function() {
        // TODO: Prepare via this.tween etc
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('animate', animate, init);
    };

});
