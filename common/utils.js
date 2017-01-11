(function() {
    'use strict';

    angular.module('utils', [])

        .factory('FileUtils', [function() {

            /**
             * convert csv string to JSON object
             * @param csv
             * @returns {Object} {cluster_id: [{..},...], ...}
             */
            function parseResult(csv) {

                var lines=csv.split("\n");
                var result = {};
                var headers=lines[0].split(",");

                headers.forEach(function(value, index, array) {
                   array[index] = value.trim();
                });

                for(var i = 1; i < lines.length; i++){

                    if (lines[i] === "")
                        continue;

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

            var inputHeaders = ["TEMPLATE_ID", "FILENAME", "FACE_X", "FACE_Y", "FACE_WIDTH", "FACE_HEIGHT"];

            /**
             *
             * @param csv
             * @returns {Object} {template_id: {...}, ...}
             */
            function parseInput(csv) {

                var lines=csv.split("\n");
                var headers=lines[0].split(",");
                var result = {};

                headers.forEach(function(value, index, array) {
                    array[index] = value.trim();
                });

                for(var i = 1; i < lines.length; i++){ // skip header

                    if (lines[i] === "")
                        continue;

                    var obj = {};
                    var template_id;
                    var currentline = lines[i].split(",");
                    for (var j = 0; j < headers.length; j++) {
                        if (headers[j] === "TEMPLATE_ID") {
                            template_id = currentline[j];
                        } else if (inputHeaders.indexOf(headers[j]) !== -1) {
                            obj[headers[j]] = currentline[j];
                        }
                    }
                    result[template_id] = obj;
                }

                return result;
            }

            return {
                parseResult: parseResult,
                parseInput: parseInput
            }
        }])

})();