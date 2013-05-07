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
        this.batch = [];
        this.errorstate = false;
    }

    /**
     * Initialize the composite before use.
     * @method module:util/preload.Preloader#add
     * @param {String} file The file to load
     * @param {String} tag Some tag to help you identify the image when it's loaded
     * @param {Function} [fnStore] A callback to receive the loaded image, in the form
     * <pre>
     * function(image, tag) {
     * }
     * </pre>
     * Where the image is a loaded Image object.
     */
    Preloader.prototype.add = function(file, tag, fnStore) {
        this.batch.push({file:file, tag:tag, fnStore:fnStore});
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

        var count = this.batch.length;
        var _this = this;

        fnProgress(0);

        function loadHandler(item, img) {
            return function() {
                if (_this.errorstate) {
                    return;
                }
                count--;
                if (item.fnStore!==undefined) {
                    item.fnStore(img, item.tag);
                }
                fnProgress(1-count/_this.batch.length);
                if (count===0) {
                    fnComplete();
                }
            };
        }

        function error(e) {
            if (!_this.errorstate) {
                _this.errorstate = true;
                fnError();
            }
        }

        for (var i = 0; i < this.batch.length; i++) {
            var next = this.batch[i];

            var img = new Image();
            img.onload = loadHandler(next, img);
            img.onerror = error;
            img.src = next.file;
        }

    };

    return Preloader;

});
