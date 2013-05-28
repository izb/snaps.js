/*global define*/
define(function() {

    'use strict';

    /**
     * @module plugins/ai/phasers/frame-phaser
     */

    var sn;

    /** Construct a phaser that performs a set number of sprite updates per frame. Note that this
     * should not be constructed directly, but rather via the plugin factory method
     * {@link module:snaps.Snaps#createPhaser|createPhaser} on the engine.
     * @constructor module:plugins/ai/phasers/frame-phaser.FramePhaser
     * @param {String} id A unique ID
     * @param {Object} [opts] An object with assorted options set in it.
     * <dl>
     *  <dt>phases</dt><dd>How many sprites should be updated on each frame? Must be at least 2.</dd>
     * </dl>
     */
    function FramePhaser(id, opts) {
        /* TODO: All plugins should link to their factory methods via doc link tags */
        /* TODO: All plgins: Passing IDs into things and promising it's unique is a bit smelly. */
        this.id = id;
        opts    = opts || {};
        if (opts.phases===undefined || opts.phases<2) {
            throw "Frame phasers must have at least 2 phases.";
        }
        this.phases    = opts.phases;
        this.buckets   = new Array(opts.phases);
        this.bucketMax = new Array(opts.phases);
        this.sprites   = [];
    }

    /**
     * Determines if a sprite should be updated on this phase
     * @method module:plugins/ai/phasers/frame-phaser.FramePhaser#phase
     * @private
     */
    FramePhaser.prototype.phase = function(sprite, now) {
        var data = sprite.phaserData[this.id];
        return data.phase===0;
    };


    /**
     * Adds a sprite to this phaser. The phaser will reschedule the sprites
     * but cannot guarantee the first frame of update the sprite will receive.
     * @method module:plugins/ai/phasers/frame-phaser.FramePhaser#addSprite
     * @param {Object} s The {@link module:sprites/sprite.Sprite|sprite} to add
     */
    FramePhaser.prototype.addSprite = function(s) {
        if (s.phaserData===undefined) {
            s.phaserData = {};
        }
        s.phaserData[this.id] = { phase: this.phases-1 };
        this.sprites.push(s);
    };

    /**
     * Removes a sprite from this phaser.
     * @method module:plugins/ai/phasers/frame-phaser.FramePhaser#removeSprite
     * @private
     * @param {Object} s The sprite to remove
     */
    FramePhaser.prototype.removeSprite = function(s) {
        /* To remove a sprite, we just remove the data for this
         * phaser. Later, when we rebalance, we look for this state
         * and remove it from the list. */
        delete s.phaserData[this.id];
    };

    /**
     * Rebalance the schedule to account for recent sprite additions or deletions.
     * @method module:plugins/ai/phasers/frame-phaser.FramePhaser#rebalance
     * @private
     */
    FramePhaser.prototype.rebalance = function(now) {
        var i, s, data, max = 0;
        var buckets    = this.buckets;

        var sprites    = this.sprites;

        var desiredMax = sprites.length/this.phases;

        for (i = buckets.length - 1; i >= 0; i--) {
            buckets[i] = 0;
            this.bucketMax[i] = Math.floor((i+1)*desiredMax - Math.floor(i*desiredMax));
        }

        var clearing = [];
        var deleted = 0;
        for (i = sprites.length - 1; i >= 0; i--) {
            s = sprites[i];
            if (s.phaserData.hasOwnProperty(this.id)) {
                data = s.phaserData[this.id];
                data.phase++;
                if (data.phase>=this.phases) {
                    data.phase = 0;
                }
                max = Math.max(max, ++buckets[data.phase]);
                if (buckets[data.phase]>this.bucketMax[data.phase]) {
                    clearing.push(s);
                }
            } else {
                deleted++;
            }
        }

        if (desiredMax>1 && desiredMax/max<0.8) { /* Only if the buckets get noticeably unbalanced do we re-sort them */

            var bucketIdx = 0;
            for (i = clearing.length - 1; i >= 0; i--) {
                s = clearing[i];
                while(buckets[bucketIdx]>=this.bucketMax[bucketIdx]) {
                    bucketIdx++;
                    if (bucketIdx===this.phases) {
                        bucketIdx = 0;
                    }
                }
                data = s.phaserData[this.id];
                buckets[data.phase]--;
                data.phase = bucketIdx;
                buckets[bucketIdx]++;
            }
        }

        /* TODO: Perhaps we only want to remove dead sprites if the dead sprite count
         * exceeds some limit */
        if (deleted>0) {
            sprites = [];
            var len = this.sprites.length;
            for (i = 0; i < len; i++) {
                if (s.phaserData.hasOwnProperty(this.id)) {
                    sprites.push(this.sprites[i]);
                }
            }
            this.sprites = sprites;
        }

    };


    return function(snaps) {
        sn = snaps;
        sn.registerPhaserPlugin('frame-phaser', FramePhaser);
    };

});
