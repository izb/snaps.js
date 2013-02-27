define([
    'util/preload',
    'util/rnd',
    'util/bitmap',
    'util/debug',
    'util/js',
    'util/url'],
function(Preloader, rnd, Bitmap, debug, js, Url) {

    'use strict';

    return {
        Preloader: Preloader,
        rnd: rnd,
        js: js,
        debug: debug,
        Bitmap: Bitmap,
        Url: Url
    };

});
