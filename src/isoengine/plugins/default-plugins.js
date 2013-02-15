define([
    'isoengine/plugins/sprite/bounce',
    'isoengine/plugins/sprite/follow-mouse',
    'isoengine/plugins/sprite/link',
    'isoengine/plugins/sprite/8way'
    ],
function(regBounce, regFollowMouse, regLink, reg8way) {

    'use strict';

    /*TODO : error on loading unregistered plugin*/

    return function(eng) {
        regBounce(eng);
        regFollowMouse(eng);
        regLink(eng);
        reg8way(eng);
    };

});
