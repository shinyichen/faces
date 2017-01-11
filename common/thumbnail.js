(function () {
    'use strict';

    angular.module('images', [])


        .directive('thumbnail', [function() {

                return {
                    restrict: 'E',
                    template: "<span><canvas></canvas></span>",
                    replace: true,
                    scope: {
                        src: '@imgSrc',      // source image path
                        sx: '=',       // source image selected area x
                        sy: '=',       // source image selected area y
                        sWidth: '=',   // source image selected area width
                        sHeight: '=',  // source image selected area height
                        dWidth: '=',   // max display width
                        dHeight: '='   // max display height
                    },
                    link: function (scope, element) {

                        scope.sx = parseInt(scope.sx);
                        scope.sy = parseInt(scope.sy);
                        scope.sWidth = parseInt(scope.sWidth);
                        scope.sHeight = parseInt(scope.sHeight);
                        scope.dWidth = parseInt(scope.dWidth);
                        scope.dHeight = parseInt(scope.dHeight);

                        var canvas = element[0].children[0]
                        canvas.width = scope.dWidth + 20;
                        canvas.height = scope.dHeight + 20;

                        var img = new Image();
                        img.src = scope.src;
                        img.addEventListener("load", function() {
                            var ctx = canvas.getContext('2d');

                            // Draw slice
                            var rx = scope.sWidth / scope.dWidth;
                            var ry = scope.sHeight / scope.dHeight;
                            var r = Math.max(rx, ry);
                            var fWidth = scope.sWidth/r;   // final thumbnail W
                            var fHeight = scope.sHeight/r; // final thumbnail H
                            var startX = (canvas.width - fWidth) / 2;
                            var startY = (canvas.height - fHeight) / 2;
                            ctx.drawImage(img, scope.sx, scope.sy, scope.sWidth, scope.sHeight, startX, startY, fWidth, fHeight);
                        }, false);
                    }
                };
            }])


})();