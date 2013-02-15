define(function() {

    'use strict';

    /** Called with the sprite as the 'this' context.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var link = function() {

        for (var i = this.link_to.length - 1; i >= 0; i--) {
            this.link_to[i].x = this.x;
            this.link_to[i].y = this.y;
        }
        return true;
    };

    var init = function() {
        for (var i = this.link_to.length - 1; i >= 0; i--) {
            this.link_to[i] = this.eng.spriteMap[this.link_to[i]];
        }
    };

    return function(eng) {
        eng.registerSpriteUpdater('link', link, init);
    };

});
