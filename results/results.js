/**
 * Created by jenniferchen on 12/29/16.
 *
 * Expected JSON result format:
 * { clutster_index : [ { "TEMPLATE_ID" : template_id,
 *                      "FILENAME" : filename,
 *                      "CLUSTER_INDEX" : cluster_index,
 *                      "CONFIDENCE" : confidence
 *                      }, ...
 *                    ]
 *    ...
 *  }
 */
(function() {

    // The Chaise RecordSet module
    angular.module('results', ['ui.bootstrap', 'fileInput', 'utils'])

        // Register the recordset controller
        .controller('resultsController', ['$scope', 'FileUtils', '$uibModal', function($scope, FileUtils, $uibModal) {

            $scope.imageDir = "../..";

            $scope.clusters = null;

            $scope.counter = 0;

            $scope.cluster_id = null;

            $scope.showOpener = true;

            $scope.showCluster = false;

            $scope.lastPage = 0;

            $scope.page = {};



            var clusterIDs = [];

            var pageSize = 25;

            $scope.open = function() {

                // csv file
                $scope.clusters = FileUtils.csv2json($scope.text);
                clusterIDs = Object.keys($scope.clusters);
                $scope.count = clusterIDs.length;
                $scope.lastPage = Math.ceil(clusterIDs.length / pageSize);
                $scope.page = {
                    "number": 1,
                    "clusters": clusterIDs.slice(0, Math.min(clusterIDs.length, pageSize))
                };
                $scope.showOpener = false;
            };

            $scope.text = null;

            $scope.more = function(cluster_id) {
                $scope.cluster_id = cluster_id;
                $scope.showCluster = true;
            };

            $scope.goClusters = function() {
                $scope.cluster_id = null;
                $scope.showCluster = false;
            };

            $scope.showImage = function(source) {
                window.open($scope.imageDir + "/" + source, '_blank');

                //$uibModal.open({
                //    backdrop: true,
                //    keyboard: true,
                //    size: "lg",
                //    template: "<img src=\"" + $scope.imageDir + "/" + source + "\">"
                //});

            };

            $scope.restart = function() {
                $scope.showOpener = true;
            };



            $scope.previous = function() {
                if ($scope.page.number !== 1) { // starts at 1
                    $scope.page.number -= 1;
                    $scope.page.clusters = clusterIDs.slice(($scope.page.number - 1) * pageSize, Math.min(clusterIDs.length, $scope.page.number * pageSize));
                }

            };

            $scope.next = function() {
                if ($scope.page.number !== $scope.lastPage) {
                    $scope.page.number += 1;
                    $scope.page.clusters = clusterIDs.slice(($scope.page.number - 1) * pageSize, Math.min(clusterIDs.length, $scope.page.number * pageSize));
                }
            }

        }])

})();
