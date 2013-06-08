/*global define*/
define(['util/uid',
        'input/ui/button',
        'input/ui/label',
        'sprites/sprite'],

function(uid, Button, Label, Sprite) {

    /**
     * @module input/ui/panel
     */

    'use strict';

    /** A panel represents a set of UI elements which are drawn in order
     * to the screen. E.g. a popup dialog panel that contains labels and
     * buttons.
     * @constructor module:input/ui/panel.Panel
     * @param {Object} data Panels can be defined in your game as JSON data.
     * This data structure describes a nested UI arrangement with a root panel.
     */
    function Panel(sn, data) {
        this.sn = sn;
        this.id = uid();
        this.children = [];
        this.x = 0;
        this.y = 0;

        if (data) {
            this.x=data.x;
            this.y=data.y;
            for (var i = 0; i < data.children.length; i++) {
                var c = data.children[i];
                var types = 0;
                for(var type in c) {
                    types++;
                    if (types>1) {
                        throw "Multiple types in UI element definition. Unexpected "+type;
                    }
                    var cd = c[type];

                    if (type==='sprite') {

                        var stateParts = parseSpriteRef(cd.def);
                        var s = Sprite.construct(sn, stateParts[0], stateParts[1], undefined, cd.x, cd.y, 0, {});

                        this.children.push(s);

                    } else if(type==='button') {

                        var b = new Button();

                        b.x = cd.x;
                        b.y = cd.y;

                        if (!sn.spriteStateExists(cd.sprite, 'inactive')) {
                            throw "Buttons must have at least an inactive state";
                        }

                        if (!sn.spriteStateExists(cd.sprite, 'active')) {
                            b.activeState = 'inactive';
                        }

                        if (!sn.spriteStateExists(cd.sprite, 'hover')) {
                            b.hoverState = 'inactive';
                        }

                        if (!sn.spriteStateExists(cd.sprite, 'disabled')) {
                            b.disabledState = 'inactive';
                        }

                        b.sprite = Sprite.construct(sn, cd.sprite, 'inactive', undefined, 0, 0, 0, {maxloops:1,autoRemove:false});

                        this.children.push(b);

                    } else if(type==='panel') {

                        this.children.push(new Panel(sn, cd));

                    } else if(type==='label') {

                        /* TODO */

                    }
                }
            }
        }
    }

    var parseSpriteRef = function(ref) {
        var parts = ref.split(':');
        if (parts.length!==2) {
            throw "Badly formed sprite ref: '"+ref+"'";
        }
        return parts;
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

        if (doShow) {
            this.sn.activatePanel(this);
        } else {
            this.sn.deactivatePanel(this);
        }

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
                /*(void)*/c.isActive(now); /* This sets the internal active flag on the sprite */
                c.draw(ctx, -xo, -yo, now);
            } else if (c instanceof Button) {
                /* Sprites expect map offsets, which are the opposite of our screen offsets, so we
                 * negate them here. */
                c.draw(ctx, -xo, -yo, now);
            } else if (c instanceof Label) {
                /* TODO */
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
