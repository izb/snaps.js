define(function() {

    function UpdatePhaser(id, phases) {
        this.id = id;
        this.phases = phases;
        if (phases<2) {
            throw "Update phasers must have at least 2 phases.";
        }
    }

    UpdatePhaser.prototype.phase = function(sprite) {
        var data = sprite.phaserData[this.id];
        return data.phase===0;
    };

    UpdatePhaser.prototype.rebalance = function(sprites) {
        var i, s, data, max = 0;
        var buckets = new Array(this.phases);
        for (i = buckets.length - 1; i >= 0; i--) {
            buckets[i] = 0;
        }

        var desiredMax = Math.ceil(sprites.length/this.phases);

        var clearing = [];
        for (i = sprites.length - 1; i >= 0; i--) {
            s = sprites[i];
            data = s.phaserData[this.id];
            data.phase++;
            if (data.phase>=this.phases) {
                data.phase = 0;
            }
            max = Math.max(max, ++buckets[data.phase]);
            if (buckets[data.phase]>desiredMax) {
                clearing.push(s);
            }
        }

        if (max/desiredMax<0.8) { /* TODO: Check that this ratio is accurate or useful. */

            var bucketIdx = 0;
            for (i = clearing.length - 1; i >= 0; i--) {
                s = clearing[i];
                while(buckets[bucketIdx]>desiredMax) {
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

    return UpdatePhaser;

});
