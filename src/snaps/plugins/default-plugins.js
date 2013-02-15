define([
    'snaps/plugins/sprite/bounce',
    'snaps/plugins/sprite/follow-mouse',
    'snaps/plugins/sprite/link',
    'snaps/plugins/sprite/8way'
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
