/*global define*/
define(function() {

    var sn;

    function FramePhaser(id, opts) {
        this.id = id;
        opts = opts || {};
        if (opts.phases===undefined || opts.phases<2) {
            throw "Frame phasers must have at least 2 phases.";
        }
        this.phases = opts.phases;
        this.buckets = new Array(opts.phases);
        this.bucketMax = new Array(opts.phases);
    }

    /** Called by snaps.spawnSprite to generate the initial phaseData for this
     * phaser instance.
     * @return An object with data that will be assigned to the sprite accessible
     * under sprite.phaseData[phaser_id]
     */
    FramePhaser.prototype.initData = function() {
        return { phase: this.phases-1 };
    };

    FramePhaser.prototype.phase = function(sprite, now) {
        var data = sprite.phaserData[this.id];
        return data.phase===0;
    };

    FramePhaser.prototype.rebalance = function(sprites, now) {
        var i, s, data, max = 0;
        var buckets = this.buckets;

        var desiredMax = sprites.length/this.phases;

        for (i = buckets.length - 1; i >= 0; i--) {
            buckets[i] = 0;
            this.bucketMax[i] = Math.floor((i+1)*desiredMax - Math.floor(i*desiredMax));
        }

        var clearing = [];
        for (i = sprites.length - 1; i >= 0; i--) {
            s = sprites[i];
            data = s.phaserData[this.id];
            data.phase++;
            if (data.phase>=this.phases) {
                data.phase = 0;
            }
            max = Math.max(max, ++buckets[data.phase]);
            if (buckets[data.phase]>this.bucketMax[data.phase]) {
                clearing.push(s);
            }
        }

        if (desiredMax/max<0.8) { /* TODO: Check that this ratio is accurate or useful. */

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

    };


    return function(snaps) {
        sn = snaps;
        sn.registerPhaserPlugin('frame-phaser', FramePhaser);
    };

});