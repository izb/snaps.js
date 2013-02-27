define(function() {

    'use strict';

    function Tile(img, x, y, w, h, xoverdraw, yoverdraw, defaultProps) {
        this.img = img;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.xoverdraw = xoverdraw;
        this.yoverdraw = yoverdraw;
        this.defaultProps = defaultProps;
    }

    Tile.prototype.draw = function(ctx, x, y) {
        ctx.drawImage(
                /* src */
                this.img,
                this.x, this.y,
                this.w, this.h,
                /*dest*/
                x-this.xoverdraw, y-this.yoverdraw,
                this.w, this.h
            );
    };

    return Tile;

});
