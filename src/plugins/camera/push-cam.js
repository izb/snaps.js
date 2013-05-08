/*global define*/
define(function() {

    'use strict';

    /* TODO: Consistency: camera vs cameras */

    /**
     * @module plugins/ai/camera/push-cam
     */

    var sn;

    /** Constructs a camera that follows a sprite. Called a push cam because the player seems to
     * "push" the camera around. Note that this should not be constructed directly, but rather
     * via the plugin factory method {@link module:snaps.Snaps#createCamera|createCamera} on the engine.
     * @constructor module:plugins/ai/camera/push-cam.PushCam
     * @param {Object} [opts] An object with assorted options set in it.
     * <dl>
     *  <dt>follow</dt><dd>The ID of the sprite to follow, e.g. <code>follow:"player1"</code></dd>
     * </dl>
     */
    function PushCam(opts) {
        /**
         * The sprite that this camera is following.
         * @type {Object}
         * @member module:plugins/ai/camera/push-cam.PushCam#follow
         */
        this.follow = sn.sprite(opts.follow);
        if (!this.follow) {
            throw "Camera can't follow missing sprite: "+opts.follow;
        }
    }

    /**
     * Called per frame
     * @method module:plugins/ai/camera/push-cam.PushCam#update
     * @private
     */
    PushCam.prototype.update = function(now) {
        sn.scrollTo(this.follow.x-sn.clientWidth/2, this.follow.y-sn.clientHeight/2);
    };

    return function(snaps) {
        sn = snaps;
        sn.registerCameraPlugin('pushcam', PushCam);
    };

});
