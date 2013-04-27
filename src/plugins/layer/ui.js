/*global define*/
define(function() {

    'use strict';

    var sn;

    /* A layer that provides user interface features in the form of mouse or touch
     * responsive widgets. */

    /**
     * @param {Object} opts Parameters for customizing the layer.
     */
    function UI(layerName, opts) {
        this.opts = opts||{};
        this.name = layerName;
    }

    UI.prototype.update = function(now) {
    };

    UI.prototype.draw = function(ctx, now) {

        /* TODO: Draw widgets */
    };

    return function(snaps) {
        sn = snaps;
        sn.registerLayerPlugin('ui', UI, function(){});
    };

});
