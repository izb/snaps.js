define([
    'util/preload',
    'util/rnd',
    'util/bitmap',
    'util/url'],
function(Preloader, rnd, Bitmap, Url) {

    'use strict';

    return {
        Preloader: Preloader,
        rnd: rnd,
        Bitmap: Bitmap,
        Url: Url
    };

});
