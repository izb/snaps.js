define([
    'plugins/sprite/bounce',
    'plugins/sprite/follow-mouse',
    'plugins/sprite/link',
    'plugins/sprite/8way'
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
