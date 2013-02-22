define(function() {

    'use strict';

    return {
        imageToRGBAData: function(image)
        {
            var w = image.width;
            var h = image.height;

            var canvas = document.createElement('canvas');
            canvas.height = h;
            canvas.width = w;
            var ctx = canvas.getContext('2d');

            ctx.drawImage(image, 0, 0);

            return ctx.getImageData(0,0,w,h).data;
        }
    };

});
