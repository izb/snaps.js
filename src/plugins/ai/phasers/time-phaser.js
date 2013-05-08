/*global define*/
define(function() {

    'use strict';

    /**
     * @module plugins/ai/phasers/time-phaser
     */

    var sn;

    /** Construct a phaser that performs a set number of sprite updates per second. Note that this
     * should not be constructed directly, but rather via the plugin factory method
     * {@link module:snaps.Snaps#createPhaser|createPhaser} on the engine.
     * @constructor module:plugins/ai/phasers/time-phaser.TimePhaser
     * @param {String} id A unique ID
     * @param {Object} [opts] An object with assorted options set in it.
     * <dl>
     *  <dt>updatesPerSecond</dt><dd>How many sprites should be updated each second? Must be >0.</dd>
     *  <dt>frameCap</dt><dd>On slow devices where the frame time exceeds 1s, every sprite will be in phase.
     *    To combat this, we cap the possible measured frame time to something <1s.
     *    This sacrifices update quality in order to give all sprites a change to have
     *    some off-phase updates. This is based on the reasoning that you should
     *    not expect things to run perfectly if your frame rate is that low.</dd>
     * </dl>
     */
    function TimePhaser(id, opts) {
        this.id = id;
        opts = opts || {};
        if (opts.updatesPerSecond===undefined || opts.updatesPerSecond<1) {
            throw "Time phasers must define a >0 number of updates per second.";
        }
        this.updatesPerSecond = opts.updatesPerSecond;
        this.lastUpdate = 0;
        this.updatesThisFrame = 0;
        this.sprites = [];

        if (opts.frameCap===undefined) {
            this.frameCap = 750; /* Frames will pretend they took no more than 750ms */
        } else {
            this.frameCap = Math.min(1000, (opts.frameCap * 1000)|0);
        }
    }

    /**
     * Determines if a sprite should be updated on this phase
     * @method module:plugins/ai/phasers/time-phaser.TimePhaser#phase
     * @private
     */
    TimePhaser.prototype.phase = function(sprite, now) {
        var data = sprite.phaserData[this.id];
        if(data.phaseOn) {
            data.lastUpdate = now;
        }
        return data.phaseOn;
    };

    /**
     * Adds a sprite to this phaser. The phaser will reschedule the sprites
     * but cannot guarantee the first frame of update the sprite will receive.
     * @method module:plugins/ai/phasers/time-phaser.TimePhaser#addSprite
     * @param {Object} s The sprite to add
     */
    TimePhaser.prototype.addSprite = function(s) {
        if (s.phaserData===undefined) {
            s.phaserData = {};
        }
        s.phaserData[this.id] = { lastUpdate: 0 };
        this.sprites.push(s);
    };

    /**
     * Removes a sprite from this phaser.
     * @method module:plugins/ai/phasers/time-phaser.TimePhaser#removeSprite
     * @private
     * @param {Object} s The sprite to remove
     */
    TimePhaser.prototype.removeSprite = function(s) {
        /* To remove a sprite, we just remove the data for this
         * phaser. Later, when we rebalance, we look for this state
         * and remove it from the list. */
        delete s.phaserData[this.id];
    };

    /**
     * Rebalance the schedule to account for recent sprite additions or deletions.
     * @method module:plugins/ai/phasers/time-phaser.TimePhaser#rebalance
     * @private
     */
    TimePhaser.prototype.rebalance = function(now) {
        var timeSinceLastFrame = Math.min(this.frameCap, now - this.lastUpdate);
        this.lastUpdate = now;
        var updateBudget = Math.floor(timeSinceLastFrame * this.updatesPerSecond / 1000);

        var i, s;

        var id = this.id;

        var sprites = this.sprites;

        sprites.sort(function(a, b) {
            return b.phaserData[id].lastUpdate - a.phaserData[id].lastUpdate;
        });

        var deleted = 0;
        for (i = sprites.length - 1; i >= 0; i--) {
            s = sprites[i];
            if (s.phaserData.hasOwnProperty(this.id)) {
                s.phaserData[this.id].phaseOn = (updateBudget--)>0;
            } else {
                deleted++;
            }
        }

        /* TODO: Perhaps we only want to remove dead sprites if the dead sprite count
         * exceeds some limit */
        if (deleted>0) {
            sprites = [];
            var len = this.sprites.length;
            for (i = 0; i < len; i++) {
                s = sprites[i];
                if (s.phaserData.hasOwnProperty(this.id)) {
                    sprites.push(s);
                }
            }
            this.sprites = sprites;
        }
    };


    return function(snaps) {
        sn = snaps;
        sn.registerPhaserPlugin('time-phaser', TimePhaser);
    };
});
