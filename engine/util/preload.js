define(function() {

    'use strict';

    function Preloader() {
        this.batch = [];
        this.errorstate = false;
    }

    Preloader.prototype.add = function(file, tag, fnStore) {
        this.batch.push({file:file, tag:tag, fnStore:fnStore});
    };

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
                item.fnStore(img, item.tag);
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
