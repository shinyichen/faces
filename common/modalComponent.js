(function () {
    'use strict';

    angular.module('modals', [])

        .component('imageModalComponent', {
            templateUrl: '../common/imageModal.html',
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function () {
                var $ctrl = this;

                $ctrl.$onInit = function () {
                    $ctrl.source = $ctrl.resolve.params.source;
                    $ctrl.boxX = $ctrl.resolve.params.boxX;
                    $ctrl.boxY = $ctrl.resolve.params.boxY;
                    $ctrl.boxWidth = $ctrl.resolve.params.boxWidth;
                    $ctrl.boxHeight = $ctrl.resolve.params.boxHeight;
                    $ctrl.match = $ctrl.resolve.params.match;
                };
            }
    });
})();