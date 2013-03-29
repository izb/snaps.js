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
    }

    /** Called by snaps.spawnSprite to generate the initial phaseData for this
     * phaser instance.
     * @return An object with data that will be assigned to the sprite accessible
     * under sprite.phaseData[phaser_id]
     */
    TimePhaser.prototype.initData = function() {
        return { lastUpdate: 0 };
    };

    TimePhaser.prototype.phase = function(sprite, now) {
        var data = sprite.phaserData[this.id];
        if(data.phaseOn) {
            data.lastUpdate = now;
        }
        return data.phaseOn;
    };

    TimePhaser.prototype.rebalance = function(sprites, now) {
        var timeSinceLastFrame = now - this.lastUpdate;
        this.lastUpdate = now;
        var updateBudget = Math.floor(timeSinceLastFrame * this.updatesPerSecond / 1000);

        var id = this.id;

        sprites.sort(function(a, b) {
            return b.phaserData[id].lastUpdate - a.phaserData[id].lastUpdate;
        });

        for (var i = sprites.length - 1; i >= 0; i--) {
            sprites[i].phaserData[this.id].phaseOn = (updateBudget--)>0;
        }
    };


    return function(snaps) {
        sn = snaps;
        sn.registerPhaserPlugin('time-phaser', TimePhaser);
    };
});
