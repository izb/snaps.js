/*global define*/
define(function() {

    'use strict';

    /**
     * @module plugins/layer/ui
     */

    var sn;

    /**
     * A layer that provides user interface features in the form of mouse or touch
     * responsive widgets.
     * Note that this should not be constructed directly, but rather via the plugin factory method
     * {@link module:snaps.Snaps#addLayer|addLayer} on the engine.
     * @constructor module:plugins/layer/ui.UI
     * @param {String} layerName A name for the layer. You might see it later on in
     * error messages.
     * @param {Object} opts Parameters for customizing the layer. There are no parameters
     * for this layer plugin though, so feel free not to pass any in.
     */
    function UI(layerName, opts) {
        this.opts = opts||{};
        this.name = layerName;
    }

    /**
     * @method module:plugins/layer/ui.UI#update
     * @private
     */
    UI.prototype.update = function(now) {
    };

    /**
     * @method module:plugins/layer/ui.UI#draw
     * @private
     */
    UI.prototype.draw = function(ctx, now) {

        /* TODO: Draw widgets */
    };

    return function(snaps) {
        sn = snaps;
        sn.registerLayerPlugin('ui', UI);
    };

});
