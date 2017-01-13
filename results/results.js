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
        .controller('resultsController', ['$scope', 'FileUtils', '$uibModal', '$http', function($scope, FileUtils, $uibModal, $http) {

            $scope.imageDir = "../.."; // relative path to image directory

            $scope.showOpener = true;  // show opener view

            $scope.presets = ["clusters_32", "clusters_64", "clusters_128", "clusters_512", "clusters_1024", "clusters_1870"];

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

            $scope.openPreset = function(id) {
                var input = "../data/" + id + "/hint.csv";
                var result = "../data/" + id + "/clusters.txt";
                $http.get(input).then(function(response) {
                    $scope.inputText = response.data;
                    return $http.get(result);
                }, function(error) {
                    console.log(error);
                }).then(function(response) {
                    $scope.resultText = response.data;
                    console.log(response.data);
                    $scope.open();
                }, function(error) {
                    console.log(error);
                });
            };

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
            $scope.showImage = function(template_id) {
                //window.open($scope.imageDir + "/" + source, '_blank');

                var template = $scope.inputs[template_id];
                 $uibModal.open({
                     animation: true,
                     backdrop: true,
                     keyboard: true,
                     size: 'lg',
                     component: 'imageModalComponent',
                     resolve: {
                         params: function () {
                             return {
                                 "source": $scope.imageDir + "/" + template.FILENAME,
                                 "boxX": template.FACE_X,
                                 "boxY": template.FACE_Y,
                                 "boxWidth": template.FACE_WIDTH,
                                 "boxHeight": template.FACE_HEIGHT
                             }
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
