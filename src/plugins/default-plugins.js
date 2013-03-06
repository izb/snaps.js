define([
    'plugins/sprite/bounce',
    'plugins/sprite/follow-mouse',
    'plugins/sprite/link',
    'plugins/sprite/8way',

    'plugins/layer/occlusion-scan',

    'plugins/fx/particles',

    'plugins/camera/push-cam',

    'plugins/collision/trace-collider'
    ],
function(
        regBounce, regFollowMouse, regLink, reg8way,
        regOcclusionScan,
        regParticles,
        regPushCam,
        regTraceCollider) {

    'use strict';

    /*TODO : error on loading unregistered plugin*/

    return function(sn) {
        regBounce(sn);
        regFollowMouse(sn);
        regLink(sn);
        reg8way(sn);

        regOcclusionScan(sn);

        regParticles(sn);

        regPushCam(sn);

        regTraceCollider(sn);
    };

});
