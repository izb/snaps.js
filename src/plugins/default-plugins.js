/*global define*/
define([
    'plugins/sprite/bounce',
    'plugins/sprite/follow-mouse',
    'plugins/sprite/link',
    'plugins/sprite/animate',
    'plugins/sprite/8way',
    'plugins/sprite/track',

    'plugins/layer/ui-layer',
    'plugins/layer/demo-trace', /* TODO: Delete and remove */

    'plugins/fx/particles',

    'plugins/ai/phasers/time-phaser',
    'plugins/ai/phasers/frame-phaser',

    'plugins/camera/push-cam',

    'plugins/collision/sprite-with-map/line-trace',
    'plugins/collision/sprite-with-map/circle-trace'
    ],
function(
        regBounce, regFollowMouse, regLink, regAnimate, reg8way, regTrack,
        regUILayer, regDemoScan,
        regParticles,
        regTimePhaser, regFramePhaser,
        regPushCam,
        regLineTrace, regCircleTrace) {

    'use strict';

    return function(sn) {
        /* TODO: Loop over arguments instead? */
        regBounce(sn);
        regFollowMouse(sn);
        regLink(sn);
        regAnimate(sn);
        reg8way(sn);
        regTrack(sn);

        regUILayer(sn);
        regDemoScan(sn);

        regParticles(sn);

        regTimePhaser(sn);
        regFramePhaser(sn);

        regPushCam(sn);

        regLineTrace(sn);
        regCircleTrace(sn);
    };

});
