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
    angular.module('results', ['ui.bootstrap', 'fileInput', 'utils', 'images', 'modals'])

        // Register the recordset controller
        .controller('resultsController', ['$scope', 'FileUtils', '$uibModal', function($scope, FileUtils, $uibModal) {

            $scope.imageDir = "../.."; // relative path to image directory

            $scope.showOpener = true;  // show opener view

            $scope.inputText = null;   // string of text from input file

            $scope.resultText = null;  // string of text from result file

            $scope.inputs = null;      // input data

            $scope.clusters = null;    // cluster data

            $scope.counter = 0;        // number of clusters

            $scope.cluster_id = null;  // current cluster being displayed

            $scope.showCluster = false; // show cluster view

            $scope.lastPage = 0;       // last page number

            $scope.page = {};          // current page info {number: 1, clusters: [0, 1, 2]}

            var clusterIDs = [];       // an array of cluster id's

            var pageSize = 25;         // number of clusters per page

            /**
             * read csv result file and generate clusters data
             */
            $scope.open = function() {

                // input file
                $scope.inputs = FileUtils.parseInput($scope.inputText);

                // result file
                $scope.clusters = FileUtils.parseResult($scope.resultText);
                clusterIDs = Object.keys($scope.clusters);
                $scope.count = clusterIDs.length;
                $scope.lastPage = Math.ceil(clusterIDs.length / pageSize);
                $scope.page = {
                    "number": 1,
                    "clusters": clusterIDs.slice(0, Math.min(clusterIDs.length, pageSize))
                };

                $scope.showOpener = false;
            };

            /**
             * go to cluster view and show all images of the cluster
             * @param cluster_id
             */
            $scope.more = function(cluster_id) {
                $scope.cluster_id = cluster_id;
                $scope.showCluster = true;
            };

            /**
             * go to cluster list view
             */
            $scope.goClusters = function() {
                $scope.cluster_id = null;
                $scope.showCluster = false;
            };

            /**
             * view individual image
             * @param source
             */
            $scope.showImage = function(source) {
                //window.open($scope.imageDir + "/" + source, '_blank');

                 $uibModal.open({
                     animation: true,
                     backdrop: true,
                     keyboard: true,
                     size: 'lg',
                     component: 'imageModalComponent',
                     resolve: {
                         source: function () {
                             return $scope.imageDir + "/" + source;
                         }
                    }
                });


            };

            $scope.restart = function() {
                $scope.showOpener = true;
                $scope.showCluster = false;
            };

            /**
             * previous page
             */
            $scope.previous = function() {
                if ($scope.page.number !== 1) { // starts at 1
                    $scope.page.number -= 1;
                    $scope.page.clusters = clusterIDs.slice(($scope.page.number - 1) * pageSize, Math.min(clusterIDs.length, $scope.page.number * pageSize));
                    window.scrollTo(0, 0);
                }

            };

            /**
             * next page
             */
            $scope.next = function() {
                if ($scope.page.number !== $scope.lastPage) {
                    $scope.page.number += 1;
                    $scope.page.clusters = clusterIDs.slice(($scope.page.number - 1) * pageSize, Math.min(clusterIDs.length, $scope.page.number * pageSize));
                    window.scrollTo(0, 0);
                }
            }

        }])

})();
