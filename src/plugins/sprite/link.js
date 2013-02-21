define(function() {

    'use strict';

    /*
     * Example options:
     *
     * opts:{
     *     link_to:[
     *         {name:'shadow',x:0,y:0},
     *         {name:'head',x:10,y:0}
     *     ]
     * }
     *
     * Means that moving this sprite will also move the shadow and
     * head sprites. Height of the linked sprites is not affected,
     * only world x,y position which can be offset with the x and y
     * values on the link.
     */

    /** Called with the sprite as the 'this' context.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var link = function() {

        for (var i = this.link_to.length - 1; i >= 0; i--) {
            this.link_to[i].sprite.x = this.x + this.link_to[i].x;
            this.link_to[i].sprite.y = this.y + this.link_to[i].y;
        }
        return true;
    };

    var init = function() {
        for (var i = this.link_to.length - 1; i >= 0; i--) {
            this.link_to[i].sprite = this.sn.spriteMap[this.link_to[i].name];
        }
    };

    return function(sn) {
        sn.registerSpriteUpdater('link', link, init);
    };

});
