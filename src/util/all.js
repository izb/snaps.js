/*global define*/
define([
    'util/preload',
    'util/rnd',
    'util/bitmap',
    'util/debug',
    'util/js',
    'util/minheap',
    'util/uid',
    'util/url'],
function(Preloader, rnd, Bitmap, debug, js, MinHeap, uid, Url) {

    'use strict';

    return {
        Preloader: Preloader,
        rnd: rnd,
        js: js,
        MinHeap: MinHeap,
        uid: uid,
        debug: debug,
        Bitmap: Bitmap,
        Url: Url
    };

});
