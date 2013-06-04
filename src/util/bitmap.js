/*global define*/
define(function() {

    'use strict';

    /**
     * @module util/bitmap
     */
    return {

        /**
         * Extract the red channel from an image into an array.
         * @function module:util/bitmap#imageToData
         * @param {DOMElement} image The source image
         * @param {Array} [r] Output: An array that will be filled with the red channel
         * bitmap data. Length will be reset.
         * @param {Array} [g] Output: An array that will be filled with the green channel
         * bitmap data. Length will be reset.
         * @param {Array} [b] Output: An array that will be filled with the blue channel
         * bitmap data. Length will be reset.
         * @param {Array} [a] Output: An array that will be filled with the alpha channel
         * bitmap data. Length will be reset.
         */
        imageToData: function(image, r, g, b, a)
        {
            var w = image.width;
            var h = image.height;

            var canvas = document.createElement('canvas');
            canvas.height = h;
            canvas.width = w;
            var ctx = canvas.getContext('2d');

            ctx.drawImage(image, 0, 0);

            var rgba = ctx.getImageData(0,0,w,h).data;

            var len = rgba.length/4;

            if (r) {
                r.length = len;
            }

            if (g) {
                g.length = len;
            }

            if (b) {
                b.length = len;
            }

            if (a) {
                a.length = len;
            }

            for (var i = 0; i < len; i++) {
                if (r) {
                    r[i] = rgba[i*4];
                }

                if (g) {
                    g[i] = rgba[i*4+1];
                }

                if (b) {
                    b[i] = rgba[i*4+2];
                }

                if (a) {
                    a[i] = rgba[i*4+3];
                }
            }
        }
    };

});
