/*global define*/
define(function() {

    'use strict';

    /**
     * @module util/bitmap
     */
    return {

        /**
         * Extract the red channel from an image into an array.
         * @function module:util/bitmap#imageToRData
         * @param {DOMElement} image The source image
         * @return {Array} An array of byte values as a regular array
         */
        imageToRData: function(image)
        {
            var w = image.width;
            var h = image.height;

            var canvas = document.createElement('canvas');
            canvas.height = h;
            canvas.width = w;
            var ctx = canvas.getContext('2d');

            ctx.drawImage(image, 0, 0);

            var rgba = ctx.getImageData(0,0,w,h).data;

            var r = new Array(rgba.length/4);

            for (var i = 0; i < r.length; i++) {
                r[i] = rgba[i*4];
            }

            return r;
        }
    };

});
