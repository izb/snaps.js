/*global define*/
define(function() {

    'use strict';

    /**
     * @module util/preload
     */

     /**
      * Create a preloader for fetching multiple image files.
      * @constructor module:util/preload.Preloader
      */
    function Preloader() {
        this.imagebatch = [];
        this.audiobatch = [];
        this.errorstate = false;
    }

    var mimeTypesAudio = [
        {ext:'.ogg', mime:'audio/ogg; codecs="vorbis"'},
        {ext:'.mp3', mime:'audio/mpeg'}
    ];

    var audioExt;

    /**
     * Adds an audio file to the preloader. The correct file extension for the
     * current browser will be determined. The extension will be either .ogg or .mp3
     * @param  {String} file The filename without extension. The extension will
     *                       be added automatically. You should therefore have a
     *                       range of file types available for different browsers.
     * @param {String} tag Some tag to help you identify the file when it's loaded
     * @param {Function} [fnStore] A callback to receive the loaded image, in the form
     * <pre>
     * function(sound, tag) {
     * }
     * </pre>
     * Where the sound is a loaded Audio object.
     */
    Preloader.prototype.addAudio = function(file, tag, fnStore) {
        if (audioExt===undefined) {
            /* First time in, determine the audio type for the platform */
            var s = new Audio();

            for (var i = 0; i < mimeTypesAudio.length; i++) {
                var t = mimeTypesAudio[i];
                if (s.canPlayType(t.mime)) {
                    audioExt = t.ext;
                    break;
                }
            }
        }
        this.audiobatch.push({file:file+audioExt, tag:tag, fnStore:fnStore});
    };

    /**
     * Adds an image file to the preloader.
     * @method module:util/preload.Preloader#addImage
     * @param {String} file The file to load
     * @param {String} tag Some tag to help you identify the file when it's loaded
     * @param {Function} [fnStore] A callback to receive the loaded image, in the form
     * <pre>
     * function(image, tag) {
     * }
     * </pre>
     * Where the image is a loaded Image object.
     */
    Preloader.prototype.addImage = function(file, tag, fnStore) {
        this.imagebatch.push({file:file, tag:tag, fnStore:fnStore});
    };

    /**
     * Start the preloader
     * @method module:util/preload.Preloader#load
     * @param  {Function} fnComplete Callback when all files are loaded.
     * @param  {Function} fnProgress Called periodically with progress expressed
     * as a number between 0 and 1.
     * @param  {Function} fnError Called on each load error.
     */
    Preloader.prototype.load = function(fnComplete, fnProgress, fnError) {

        var count = this.imagebatch.length + this.audiobatch.length,
            _this = this,
            i, next;

        fnProgress(0);

        function loadHandler(item, ob) {
            return function() { /* TODO: Use bind instead. */
                if (_this.errorstate) {
                    return;
                }

                count--;

                if (item.fnStore!==undefined) {
                    item.fnStore(ob, item.tag);
                }

                fnProgress(1-count/(_this.imagebatch.length + _this.audiobatch.length));

                if (count===0) {
                    fnComplete();
                }
            };
        }

        function errorHandler(item) {
            return function(e) {
                if (!_this.errorstate) {
                    _this.errorstate = true;
                    fnError("Failed to load "+item.file);
                }
            };
        }

        for (i = 0; i < this.imagebatch.length; i++) {
            next = this.imagebatch[i];

            var img = new Image();
            img.onload = loadHandler(next, img);
            img.onerror = errorHandler(next);
            img.src = next.file;
        }

        for (i = 0; i < this.audiobatch.length; i++) {
            next = this.audiobatch[i];

            var snd = new Audio();
            snd.addEventListener('canplaythrough', loadHandler(next, snd));
            snd.onerror = errorHandler(next);
            snd.src =  next.file;
        }
    };

    return Preloader;

});
