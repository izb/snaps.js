/*global define*/
define(['util/uid',
        'sprites/sprite'],

function(uid, Sprite) {

    /**
     * @module input/ui/panel
     */

    'use strict';

    /** A panel represents a set of UI elements which are drawn in order
     * to the screen. E.g. a popup dialog panel that contains labels and
     * buttons.
     * @constructor module:input/ui/panel.Panel
     */
    function Panel(sn) {
        this.sn = sn;
        this.id = uid();
        this.children = [];
        this.x = 0;
        this.y = 0;
    }

    /**
     * Panels can be defined in your game as JSON data. Call this static
     * factory method to create a panel hierarchy from a JSON description.
     * @member module:input/ui/panel.Panel#load
     * @static
     * @param {Object} data A JSON data structure that describes a nested
     * UI arrangement with a root panel.
     * @return {Panel} A new panel.
     */
    Panel.load = function(data) {
        /* TODO */
        return this;
    };

    /**
     * Show this panel on-screen.
     * @member module:input/ui/panel.Panel#show
     * @param  {Boolean} [doShow=true] Pass true to show or false to hide.
     */
    Panel.prototype.show = function(doShow) {
        if (doShow===undefined) {
            doShow = true;
        }
        /* TODO */

        return this;
    };

    /**
     * Hide this panel.
     * @member module:input/ui/panel.Panel#hide
     */
    Panel.prototype.hide = function() {
        this.show(false);
        return this;
    };

    /**
     * Moves this panel to the center of the screen. Only works on the root
     * panel if it has dimensions set. In all other cases, the behaviour is
     * undefined.
     * @member module:input/ui/panel.Panel#center
     * @param  {Boolean} [cy=true] Pass true to center vertically.
     * @param  {Boolean} [cx=true] Pass true to center horizontally.
     */
    Panel.prototype.center = function(cy, cx) {
        if (cy===undefined) {
            cy = true;
        }

        if (cx===undefined) {
            cx = true;
        }

        if (cy && this.height) {
            this.y = ((this.sn.clientHeight - this.height) / 2)|0;
        }

        if (cx && this.width) {
            this.x = ((this.sn.clientWidth - this.width) / 2)|0;
        }

        return this;
    };

    /**
     * Draws this panel. This will be called on every frame.
     * @param  {CanvasRenderingContext2D} ctx Drawing context
     * @private
     */
    Panel.prototype.draw = function(now, ctx, xo, yo) {
        xo = xo || 0;
        yo = yo || 0;

        xo+=this.x;
        yo+=this.y;

        var len = this.children.length;
        for (var i = 0; i < len; i++) {
            var c = this.children[i];
            if (c instanceof Panel) {
                c.draw(now, ctx, xo, yo);
            } else if (c instanceof Sprite) {
                /* Sprites expect map offsets, which are the opposite of our screen offsets, so we
                 * negate them here. */
                c.draw(ctx, -xo+this.x, -yo+this.y, now);
            } else {
                /* TODO */
                throw "Can't draw "+c;
            }
        }
    };

    /* TODO: Panels should render off-screen so we can do transition in/out effects like
     * fade. This implies that the root panel in the data should have dimensions. */

    return Panel;
});
