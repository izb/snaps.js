/*global define*/
define(['util/uid', 'util/js'], function(uid, js) {

    'use strict';

    var copyProps = js.copyProps;

    /**
     * @module map/tile
     */

     /* TODO: Is this entire module private? */

    /** Represents a map tile
     * @constructor module:map/tile.Tile
     * @param {DOMElement} img The source image
     * @param {Number} x The x position in the image of the tile
     * @param {Number} y The y position in the image of the tile
     * @param {Number} w The width of a tile
     * @param {Number} h The height of a tile
     * @param {Number} xoverdraw How much beyond the tile bounds does
     * this tile draw, extending to the right
     * @param {Number} yoverdraw How much beyond the tile bounds does
     * this tile draw, extending upwards
     * @param {Number} defaultProps Default properties for this tile type
     * @param {Number} properties Properties for this tile instance, which override
     * the defaults.
     */
    function Tile(img, x, y, w, h, xoverdraw, yoverdraw, defaultProps, properties) {
        this.img          = img;
        this.x            = x;
        this.y            = y;
        this.w            = w;
        this.h            = h;
        this.xoverdraw    = xoverdraw;
        this.yoverdraw    = yoverdraw;
        this.defaultProps = defaultProps||{};
        this.properties   = properties||{};
    }

    /**
     * @method module:map/tile.Tile#draw
     * @private
     */
    Tile.prototype.draw = function(ctx, x, y) {
        ctx.drawImage(
                /* src */
                this.img,
                this.x, this.y,
                this.w, this.h,
                /*dest*/
                x-this.xoverdraw, y-this.yoverdraw,
                this.w, this.h
            );
    };

    /** Gets a property value from the tile.
     * @method module:map/tile.Tile#getProperty
     * @param {String} prop The property to get
     * @return {String} The string value or undefined
     */
    Tile.prototype.getProperty = function(prop) {
        if (this.properties.hasOwnProperty(prop)) {
            return this.properties[prop];
        }

        if (this.defaultProps.hasOwnProperty(prop)) {
            return this.defaultProps[prop];
        }

        return undefined;
    };

    /** Gets multiple properties from a tile. If any of
     * the properties are missing, the value is set to undefined.
     * @method module:map/tile.Tile#getProperties
     * @param {Array} props The properties to get
     * @return {Object} An object describing the properties.
     */
    Tile.prototype.getProperties = function(props) {
        var result = {};
        for (var i = props.length - 1; i >= 0; i--) {
            var prop = props[i];

            if (this.properties.hasOwnProperty(prop)) {
                result[prop] = this.properties[prop];
                continue;
            }

            if (this.defaultProps.hasOwnProperty(prop)) {
                result[prop] = this.defaultProps[prop];
                continue;
            }

            result[prop] = undefined;
        }

        return result;
    };

    /** Sets a property value on a tile.
     * @method module:map/tile.Tile#setProperty
     * @param {String} prop The property to set.
     * @param {*} val The value to set
     */
    Tile.prototype.setProperty = function(prop, val) {
        this.properties[prop] = val;
    };

    /** Sets multiple properties on a tile.
     * @method module:map/tile.Tile#setProperties
     * @param {Object} props An object containing all the properties
     * to copy into the tile's properties.
     */
    Tile.prototype.setProperties = function(props) {
        copyProps(props, this.properties);
    };

    return Tile;

});
