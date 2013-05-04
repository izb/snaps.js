/*global define*/
define([
    'plugins/sprite/bounce',
    'plugins/sprite/follow-mouse',
    'plugins/sprite/animate',
    'plugins/sprite/8way',
    'plugins/sprite/track',
    'plugins/sprite/flock',
    'plugins/sprite/apply-velocity',

    'plugins/layer/ui',
    'plugins/layer/ground-sprites',

    'plugins/fx/particles',

    'plugins/ai/phasers/time-phaser',
    'plugins/ai/phasers/frame-phaser',

    'plugins/camera/push-cam',

    'plugins/collision/sprite-with-map/line-trace',
    'plugins/collision/sprite-with-map/circle-trace'
    ],
function() {

    'use strict';

    /**
     * @module plugins/default-plugins
     * @private
     */

    var plugins = arguments;

    return function(sn) {
        for (var i = 0; i < plugins.length; i++) {
            plugins[i](sn);
        }
    };

});
