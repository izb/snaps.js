define(function() {

    'use strict';

    return {

        debugText: function(ctx, text, x, y) {
            ctx.fillStyle = "black";
            ctx.font = "bold 16px Arial";
            ctx.fillText(text,x+1, y);
            ctx.fillText(text,x-1, y);
            ctx.fillText(text,x, y+1);
            ctx.fillText(text,x, y-1);
            ctx.fillStyle = "white";
            ctx.fillText(text,x, y);
        }

    };

});
