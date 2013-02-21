define(function() {

    'use strict';

    /*
     * Example options:
     *
     * opts:{
     *     bounce_height:100,
     *     bounce_base:64,
     * }
     *
     * Bounces up 100px from a 'floor' height of 64px. Bounce duration
     * is the current animation sequence duration.
     */

    /** Called with the sprite as the 'this' context.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var bounce = function() {
        var b = this.state.jogPos(this.epoch, this.sn.getNow());
        b*=2;
        b-=1;
        b*=b;

        this.h = this.bounce_base + this.bounce_height * (1-b);
        return true;
    };

    return function(sn) {
        sn.registerSpriteUpdater('bounce', bounce, function(){});
    };

});
