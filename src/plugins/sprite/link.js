define(function() {

    'use strict';

    var sn;

    /*
     * Example options:
     *
     * updates:[{
     *     name:'link',
     *     link_to:[
     *         {name:'shadow',x:0,y:0},
     *         {name:'head',x:10,y:0}
     *     ]
     * }]
     *
     * Means that moving this sprite will also move the shadow and
     * head sprites. Height of the linked sprites is not affected,
     * only world x,y position which can be offset with the x and y
     * values on the link.
     */

    /** Called with the update options as the 'this' context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var link = function(now) {

        var s = this.sprite;
        for (var i = this.link_to.length - 1; i >= 0; i--) {
            this.link_to[i].sprite.x = s.x + this.link_to[i].x;
            this.link_to[i].sprite.y = s.y + this.link_to[i].y;
        }
        return true;
    };

    /** Called with the update options as the 'this' context, one of which
     * is this.sprite, which refers to the sprite being updated.
     */
    var init = function() {
        for (var i = this.link_to.length - 1; i >= 0; i--) {
            this.link_to[i].sprite = sn.spriteMap[this.link_to[i].name];
        }
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('link', link, init);
    };

});
