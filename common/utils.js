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
                        result[cluster_index] = {};
                        result[cluster_index].templates = [];
                    }
                    result[cluster_index].templates.push(obj);

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

            /**
             * read ground truth file
             * append subject to templates
             * return subjects
             * @param csv string
             * @param templates
             * @return Object subjects ({subject_id: [template_id1, template_id2, ...], ....})
             */
            function processGroundTruth(csv, templates) {

                var lines=csv.split("\n");
                var headers=lines[0].split(",");
                var id_col = -1, subject_col = -1;
                var subjects = {};

                headers.forEach(function(value, index, array) {
                    var col = value.trim();
                    array[index] = col;
                    if (col === "TEMPLATE_ID")
                        id_col = index;
                    else if (col === "SUBJECT_ID")
                        subject_col = index;
                });

                for(var i = 1; i < lines.length; i++){ // skip header

                    if (lines[i] === "")
                        continue;

                    var currentline = lines[i].split(",");
                    var template_id = currentline[id_col];
                    var subject_id = currentline[subject_col];

                    // append subject to templates
                    if (templates[template_id]) { // only care if template is used
                        templates[template_id].SUBJECT_ID = subject_id;

                        if (subjects[subject_id]) // subject already created
                            subjects[subject_id].push(template_id);
                        else
                            subjects[subject_id] = [template_id]; // create new entry
                    }

                }

                return subjects;

            }

            return {
                parseResult: parseResult,
                parseInput: parseInput,
                processGroundTruth: processGroundTruth
            }
        }])

})();