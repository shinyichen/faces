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
        })
        .component('subjectModalComponent', {
            templateUrl: '../common/subjectModal.html',
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function () {
                var $ctrl = this;
                $ctrl.view = "overview"; // overview, cluster
                $ctrl.selectedCid = null;

                $ctrl.$onInit = function () {
                    $ctrl.subject_id = $ctrl.resolve.params.subject_id;
                    $ctrl.imageDir = $ctrl.resolve.params.imageDir;
                    $ctrl.subjectClusters = $ctrl.resolve.params.subjectClusters;
                    $ctrl.clusters = $ctrl.resolve.params.clusters;
                    $ctrl.templates = $ctrl.resolve.params.templates;
                    $ctrl.averagePrecision = $ctrl.resolve.params.averagePrecision;
                    $ctrl.averageRecall = $ctrl.resolve.params.averageRecall;
                    $ctrl.totalRecall = $ctrl.resolve.params.totalRecall;
                };

                $ctrl.goOverview = function() {
                    $ctrl.view = "overview";
                };

                $ctrl.goCluster = function(cluster_id) {
                    $ctrl.selectedCid = cluster_id;
                    $ctrl.view = "cluster";
                    window.scrollTo(0, 0);
                };
            }
        });
})();