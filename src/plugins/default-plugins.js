define([
    'plugins/sprite/bounce',
    'plugins/sprite/follow-mouse',
    'plugins/sprite/link',
    'plugins/sprite/animate',
    'plugins/sprite/8way',

    'plugins/layer/ui-layer',
    'plugins/layer/occlusion-scan',

    'plugins/fx/particles',

    'plugins/camera/push-cam',

    'plugins/collision/sprite-with-map/line-trace',
    'plugins/collision/sprite-with-map/circle-trace'
    ],
function(
        regBounce, regFollowMouse, regLink, regAnimate, reg8way,
        regUILayer, regOcclusionScan,
        regParticles,
        regPushCam,
        regLineTrace, regCircleTrace) {

    'use strict';

    return function(sn) {
        regBounce(sn);
        regFollowMouse(sn);
        regLink(sn);
        regAnimate(sn);
        reg8way(sn);

        regUILayer(sn);
        regOcclusionScan(sn);

        regParticles(sn);

        regPushCam(sn);

        regLineTrace(sn);
        regCircleTrace(sn);
    };

});
