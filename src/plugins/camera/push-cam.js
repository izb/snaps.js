define(function() {

    'use strict';

    var sn;

    /*
     * Example options:
     *
     * opts:{
     *     follow:"player1",
     * }
     *
     * Camera follows the player1 sprite
     */

    function PushCam(opts) {
        this.follow = sn.sprite(opts.follow);
        if (!this.follow) {
            throw "Camera can't follow missing sprite: "+opts.follow;
        }
    }

    PushCam.prototype.update = function(now) {
        sn.scrollTo(this.follow.x-sn.clientWidth/2, this.follow.y-sn.clientHeight/2);
    };

    return function(snaps) {
        sn = snaps;
        sn.registerCameraPlugin('pushcam', PushCam, function(){});
    };

});