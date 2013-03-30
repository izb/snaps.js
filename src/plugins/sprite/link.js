/*global define*/
define(function() {

    'use strict';

    var sn;
    
    /* TODO: Replace this with the track plugin */

    function Link() {

    }

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
     * @param  {Number} now The time of the current frame
     * @param  {Bool} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */

    Link.prototype.update = function(now, phaseOn) {
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
    Link.prototype.init = function() {
        if (typeof this.link_to !== 'object') {
            throw "Link plugin requires a link_to option value (array)";
        }

        for (var i = this.link_to.length - 1; i >= 0; i--) {
            this.link_to[i].sprite = sn.spriteMap[this.link_to[i].name];
        }
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('link', Link);
    };

});
