/**
 * Created by jenniferchen on 12/29/16.
 */
(function() {

    // The Chaise RecordSet module
    angular.module('results', ['ui.bootstrap', 'fileInput'])


        // Register the recordset controller
        .controller('resultsController', ['$scope', function($scope) {

            $scope.resultSet = null;

            $scope.showOpener = true;

            $scope.open = function() {
                console.log($scope.text);
                $scope.resultSet = JSON.parse($scope.text);
                console.log($scope.resultSet);
                $scope.showOpener = false;
            };

            $scope.text = null;

        }])


})();
