(function() {
    'use strict';

    angular.module('utils', [])

        .factory('FileUtils', [function() {

            /**
             * convert csv string to JSON object
             * @param csv
             * @returns {Object}
             */
            function csv2json(csv) {

                var lines=csv.split("\n");
                var result = {};
                var headers=lines[0].split(",");

                headers.forEach(function(value, index, array) {
                   array[index] = value.trim();
                });

                for(var i = 1; i < lines.length; i++){

                    var obj = {};
                    var cluster_index;
                    var currentline = lines[i].split(",");

                    for(var j = 0; j < headers.length; j++){
                        if (headers[j] == "CLUSTER_INDEX") {
                            cluster_index = currentline[j];
                        } else {
                            obj[headers[j]] = currentline[j];
                        }
                    }

                    if (!result[cluster_index]) {
                        result[cluster_index] = [];
                    }
                    result[cluster_index].push(obj);

                }

                return result; //JavaScript object
            }

            return {
                csv2json: csv2json
            }
        }])

})();