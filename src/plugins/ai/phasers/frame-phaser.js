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
        this.sprites = [];
    }

    FramePhaser.prototype.phase = function(sprite, now) {
        var data = sprite.phaserData[this.id];
        return data.phase===0;
    };

    FramePhaser.prototype.addSprite = function(s) {
        if (s.phaserData===undefined) {
            s.phaserData = {};
        }
        s.phaserData[this.id] = { phase: this.phases-1 };
        this.sprites.push(s);
    };

    FramePhaser.prototype.removeSprite = function(s) {
        /* To remove a sprite, we just remove the data for this
         * phaser. Later, when we rebalance, we look for this state
         * and remove it from the list. */
        delete s.phaserData[this.id];
    };

    FramePhaser.prototype.rebalance = function(now) {
        var i, s, data, max = 0;
        var buckets = this.buckets;

        var sprites = this.sprites;

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

        if (desiredMax/max<0.8) { /* Only if the buckets get noticeably unbalanced do we re-sort them */

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
