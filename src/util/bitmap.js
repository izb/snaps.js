/*global define*/
define(function() {

    'use strict';

    return {
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
