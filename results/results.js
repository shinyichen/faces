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
        .controller('resultsController', ['$scope', 'FileUtils', function($scope, FileUtils) {

            $scope.imageDir = "../..";

            $scope.clusters = null;

            $scope.cluster_id = null;

            $scope.showOpener = true;

            $scope.showCluster = false;

            $scope.open = function() {

                // csv file
                $scope.clusters = FileUtils.csv2json($scope.text);

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
            };
        }])

})();
