define([
    'plugins/sprite/bounce',
    'plugins/sprite/follow-mouse',
    'plugins/sprite/link',
    'plugins/sprite/8way',

    'plugins/fx/particles',

    'plugins/collision/trace-collider'
    ],
function(
        regBounce, regFollowMouse, regLink, reg8way,
        regParticles,
        regTraceCollider) {

    'use strict';

    /*TODO : error on loading unregistered plugin*/

    return function(sn) {
        regBounce(sn);
        regFollowMouse(sn);
        regLink(sn);
        reg8way(sn);

        regParticles(sn);

        regTraceCollider(sn);
    };

});
