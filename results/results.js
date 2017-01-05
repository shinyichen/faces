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

            $scope.resultSet = null;

            $scope.showOpener = true;

            $scope.open = function() {
                console.log($scope.text);

                // if csv file
                $scope.resultSet = FileUtils.csv2json($scope.text);

                // if json file
                //$scope.resultSet = JSON.parse($scope.text);

                console.log($scope.resultSet);
                $scope.showOpener = false;
            };

            $scope.text = null;

        }])


})();
