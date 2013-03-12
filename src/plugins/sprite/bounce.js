define(function() {

    'use strict';

    var sn;

    function Bounce() {

    }

    /*
     * Example options:
     *
     * updates:[{
     *     name:'bounce',
     *     bounce_height:100,
     *     bounce_base:64,
     * }]
     *
     * Bounces up 100px from a 'floor' height of 64px. Bounce duration
     * is the current animation sequence duration.
     */

    /** Called with the sprite as the 'this' context.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    Bounce.prototype.update = function(now) {
        var s = this.sprite;
        var b = s.state.jogPos(s.epoch, sn.getNow());
        b*=2;
        b-=1;
        b*=b;

        s.h = this.bounce_base + this.bounce_height * (1-b);
        return true;
    };

    Bounce.prototype.init = function() {
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('bounce', Bounce);
    };

});
