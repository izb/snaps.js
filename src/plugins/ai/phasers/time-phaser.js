/*global define*/
define(function() {

    var sn;

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

    TimePhaser.prototype.phase = function(sprite, now) {
        var data = sprite.phaserData[this.id];
        if(data.phaseOn) {
            data.lastUpdate = now;
        }
        return data.phaseOn;
    };

    TimePhaser.prototype.addSprite = function(s) {
        if (s.phaserData===undefined) {
            s.phaserData = {};
        }
        s.phaserData[this.id] = { lastUpdate: 0 };
        this.sprites.push(s);
    };

    TimePhaser.prototype.removeSprite = function(s) {
        /* To remove a sprite, we just remove the data for this
         * phaser. Later, when we rebalance, we look for this state
         * and remove it from the list. */
        delete s.phaserData[this.id];
    };

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
