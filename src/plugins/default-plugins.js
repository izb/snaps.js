/*global define*/
define([
    'plugins/sprite/bounce',
    'plugins/sprite/follow-mouse',
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
function() {

    'use strict';

    return function(sn) {
        for (var i = 0; i < arguments.length; i++) {
            arguments[i](sn);
        }
    };

});
