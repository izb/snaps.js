/*global define*/
define(function() {

    var sn;

    function TimePhaser(id, opts) {
    }

    TimePhaser.prototype.phase = function(sprite) {
        return true;
    };

    TimePhaser.prototype.rebalance = function(sprites) {
    };


    return function(snaps) {
        sn = snaps;
        sn.registerPhaserPlugin('time-phaser', TimePhaser);
    };
});
