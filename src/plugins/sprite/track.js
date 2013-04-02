/*global define*/
define(function() {

    'use strict';

    var sn;

    /*
     * Example options:
     *
     * updates:[{
     *     name:'track',
     *     fn: function(sprite) { // track sprite // }
     * }]
     *
     * updates:[{
     *     name:'track',
     *     fn: myProximityTracker.track.bind(myProximityTracker)
     * }]
     */

    function Track() {
    }

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
    Track.prototype.update = function(now, phaseOn) {

        var s = this.sprite;

        if (s.x!==this.x || s.y!==this.y || s.h!==this.h) {
            this.fn(s);
            this.x=s.x;
            this.y=s.y;
            this.h=s.h;
        }

        return true;
    };

    Track.prototype.onSpriteRemoved = function() {
        if (this.deregister) {
            this.deregister(this.sprite);
        }
    };

    Track.prototype.init = function(s) {
        this.sprite = s;
        this.x=s.x;
        this.y=s.y;
        this.h=s.h;
        if (this.register) {
            this.register(s);
        }
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('track', Track);
    };

});
