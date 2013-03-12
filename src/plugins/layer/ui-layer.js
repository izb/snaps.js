define(function() {

    'use strict';

    var sn;

    /* A layer that provides user interface features in the form of mouse or touch
     * responsive widgets. */

    /**
     * @param {Object} opts Parameters for customizing the layer. Requires these properties:
     * 'x' and 'y' The center of the scan.
     */
    function UILayer(layerName, opts) {
        this.opts = opts||{};
        this.name = layerName;
    }

    UILayer.prototype.update = function(now) {
    };

    UILayer.prototype.draw = function(ctx, now) {

        /* TODO: Draw widgets */
    };

    return function(snaps) {
        sn = snaps;
        sn.registerLayerPlugin('ui-layer', UILayer, function(){});
    };

});
