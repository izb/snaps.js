/*global define*/
define([
    'util/preload',
    'util/rnd',
    'util/bitmap',
    'util/debug',
    'util/js',
    'util/uid',
    'util/url'],
function(Preloader, rnd, Bitmap, debug, js, uid, Url) {

    'use strict';

    return {
        Preloader: Preloader,
        rnd: rnd,
        js: js,
        uid: uid,
        debug: debug,
        Bitmap: Bitmap,
        Url: Url
    };

});
