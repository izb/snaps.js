/*global define*/
define(function() {

    'use strict';

    var sn;

    /*
     * The track plugin will call a callback function only whenever a
     * sprite's position changes.
     *
     * Example options:
     *
     * var tracker = new _this.sn.ProximityTracker(100);
     *
     * updates:[{
     *     name:'flock',
     *     tracker: tracker,
     *     flock_speed: 120,
     *     flock_neighborhood: 50,
     *     flock_neighbor_limit: 5
     * }]
     *
     * flock_speed is in pixels/second. Initial sprite orientation should be set on the
     * sprite with setDirection.
     *
     * flock_neighborhood is in pixels and defines the radius that defines the influential
     * flockmates. Larger is generally better but slower, dependant on the tracker.
     *
     * flock_neighbor_limit is the number of neighbors that will contribute to the influence.
     * E.g. if set to 5, only the 5 closest flockmates will influence the sprite. Larger is
     * better, but slower. Set to a very large number to include all flockmates in the
     * neighborhood.
     *
     * Sprites that flock with the same tracker will belong to the same flock.
     *
     * This plugin supports phasers and will flock more efficiently, but with less
     * accuracy with phased updates.
     *
     */

    function Flock() {
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
    Flock.prototype.update = function(now, phaseOn) {

        var s = this.sprite;

        this.tracker.find(s.x, s.y, this.flock_neighborhood, true);

        return true;
    };

    Flock.prototype.onSpriteRemoved = function() {
    };

    Flock.prototype.init = function(s) {
        this.sprite = s;

        /* Some sensible defaults */

        if (this.flock_speed===undefined) {
            this.flock_speed = 120;
        }

        if (this.flock_neighborhood===undefined) {
            this.flock_neighborhood = 50;
        }

        if (this.flock_neighbor_limit===5) {
            this.flock_neighbor_limit = 5;
        }
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('flock', Flock);
    };

});
