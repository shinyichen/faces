/**
 * Created by jenniferchen on 12/29/16.
 *
 * clusters data format:
 *
 *  { cluster_index : { "templates": [ { "TEMPLATE_ID" : template_id,
 *                                       "FILENAME" : filename,
 *                                       "CLUSTER_INDEX" : cluster_index,
 *                                       "CONFIDENCE" : confidence
 *                                     }, ...
 *                                   ]
 *                      "precision": p,    // opt, calculated from ground truth
 *                      "recall": r        // opt, calculated from ground truth
 *                    }
 *    ...
 *  }
 *
 *  templates data format:
 *
 *  { template_id: {"FILENAME": filename,
  *                 "FACE_X": face_x,
  *                 "FACE_Y": face_y,
  *                 "FACE_WIDTH": face_w,
  *                 "FACE_HEIGHT": face_h,
  *                 "SUBJECT_ID": subject_id   // opt, added if has ground truth file
  *                 }
  *   ...
  * }
 */
(function() {

    // The Chaise RecordSet module
    angular.module('results', ['ui.bootstrap', 'fileInput', 'images', 'modals'])

        .constant('views', {
            "opener": "opener",
            "overview": "overview",
            "cluster": "cluster"
        })

        // Register the recordset controller
        .controller('resultsController', ['$scope', '$uibModal', '$http', 'views', function($scope, $uibModal, $http, views) {

            $scope.imageDir = "../.."; // relative path to image directory

            $scope.avgImgDir = null;

            $scope.loading = false;

            $scope.view = views.opener;  // show opener view at startup

            $scope.formModel = {
                "preset": "",
                "groundTruth": true
            };

            $scope.presets = ["clusters_32", "clusters_64", "clusters_128", "clusters_256", "clusters_512", "clusters_1024", "clusters_1870"];

            $scope.inputs = {
                "inputText": null,   // string of text from input file
                "resultText": null,  // string of text from result file
                "groundTruthText": null // string of text from ground truth file, optional
            };

            $scope.useGroundTruth = false;

            $scope.templates = null;      // input data

            $scope.clusters = null;    // cluster data

            $scope.subjects = null;    // {subject_id: [template_ids...], ...}

            $scope.subjectClusters = null; // {subject_id: [cluster id's]}

            $scope.counter = 0;        // number of clusters

            $scope.cluster_id = null;  // current cluster being displayed

            $scope.lastPage = 0;       // last page number

            $scope.page = {};          // current page info {number: 1, clusters: [0, 1, 2]}

            $scope.pages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // pagination being shown

            $scope.expanded = false;

            $scope.alerts = [];

            var clusterIDs = [];       // an array of cluster id's

            var subjectIDs = null;  // a list of subject IDs

            var pageSize = 12;         // number of clusters per page

            $scope.closeAlert = function(index) {
                $scope.alerts.splice(index, 1);
            };

            /**
             * read csv result file and generate clusters data
             */
            $scope.open = function() {

                if ($scope.formModel.preset !== "") {
                    $scope.loading = true;
                    loadPreset($scope.formModel.preset);
                } else if ($scope.inputs.resultText && $scope.inputs.inputText){
                    $scope.loading = true;
                    load();
                } else {
                    $scope.alerts.push({"msg": "Select from a preset or provide templates and clusters files."});
                }
            };

            function loadPreset(id) {

                var input = "../data/" + id + "/hint.csv";
                var result = "../data/" + id + "/clusters.txt";
                var gt = "../data/ground_truth.csv";
                $scope.avgImgDir = "../data/" + id;

                $http.get(input).then(function(response) {
                    $scope.inputs.inputText = response.data;
                    return $http.get(result);
                }, function(error) {
                    $scope.loading = false;
                    $scope.alerts.push({"msg": "Error reading templates file: " + error});
                }).then(function(response) {

                    $scope.inputs.resultText = response.data;
                    if ($scope.formModel.groundTruth) {
                        $scope.useGroundTruth = true;
                        $http.get(gt).then(function(r) {
                            $scope.inputs.groundTruthText = r.data;
                            load();
                        }, function(error) {
                            $scope.loading = false;
                            $scope.alerts.push({"msg": "Error reading ground truth file: " + error});
                        });
                    } else {
                        $scope.useGroundTruth = false;
                        load();
                    }
                }, function(error) {
                    $scope.loading = false;
                    $scope.alerts.push({"msg": "Error reading clusters file: " + error});
                });
            }

            function load() {

                // result file
                parseClusters($scope.inputs.resultText);
                clusterIDs = Object.keys($scope.clusters);

                // input file
                parseTemplates($scope.inputs.inputText);

                // ground truth (optional)
                if ($scope.inputs.groundTruthText) {
                    $scope.useGroundTruth = true;
                    parseGroundTruth($scope.inputs.groundTruthText);
                    subjectIDs = Object.keys($scope.subjects);
                    calculatePrecision();
                    $scope.count = subjectIDs.length;
                    $scope.page = {
                        "number": 1,
                        "subjects": subjectIDs.slice(0, Math.min(clusterIDs.length, pageSize))
                    };
                    $scope.page.open = [];
                    for (var i = 0; i < $scope.page.subjects.length; i++) {
                        $scope.page.open.push($scope.expanded);
                    }
                    $scope.lastPage = Math.ceil(subjectIDs.length / pageSize);

                }
                else {
                    $scope.useGroundTruth = false;
                    $scope.count = clusterIDs.length;
                    $scope.page = {
                        "number": 1,
                        "clusters": clusterIDs.slice(0, Math.min(clusterIDs.length, pageSize))
                    };
                    $scope.lastPage = Math.ceil(clusterIDs.length / pageSize);
                }

                $scope.loading = false;
                $scope.view = views.overview;
            }

            $scope.toggleCollapse = function() {
                $scope.expanded = !$scope.expanded;
                $scope.page.open.forEach(function(value, index, array) {
                    array[index] = $scope.expanded;
                });
            };

            /**
             * go to cluster view and show all images of the cluster
             * @param cluster_id
             */
            $scope.more = function(cluster_id) {
                $scope.cluster_id = cluster_id;
                $scope.view = views.cluster;
            };

            /**
             * go to cluster list view
             */
            $scope.goClusters = function() {
                $scope.cluster_id = null;
                $scope.view = views.overview;
            };

            /**
             * view individual image
             * @param template_id
             * @param match boolean optional, image is a match or not
             */
            $scope.showImage = function(template_id, match) {

                var template = $scope.templates[template_id];
                 $uibModal.open({
                     animation: true,
                     backdrop: true,
                     keyboard: true,
                     size: 'lg',
                     component: 'imageModalComponent',
                     resolve: {
                         params: function () {
                             return {
                                 "source": $scope.imageDir + "/" + template["FILENAME"],
                                 "boxX": template["FACE_X"],
                                 "boxY": template["FACE_Y"],
                                 "boxWidth": template["FACE_WIDTH"],
                                 "boxHeight": template["FACE_HEIGHT"],
                                 "match": match
                             }
                         }
                    }
                });


            };

            $scope.restart = function() {
                $scope.useGroundTruth = false;
                $scope.inputs.inputText = null;
                $scope.inputs.resultText = null;
                $scope.inputs.groundTruthText = null;
                $scope.view = views.opener;
                $scope.formModel.preset = "";
                $scope.pages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                $scope.expanded = false;
            };

            /**
             * previous page
             */
            $scope.previous = function() {
                if ($scope.page.number !== 1) { // starts at 1
                    $scope.gotoPage($scope.page.number - 1);
                }

            };

            /**
             * next page
             */
            $scope.next = function() {
                if ($scope.page.number !== $scope.lastPage) {
                    $scope.gotoPage($scope.page.number + 1);
                }
            };

            $scope.gotoPage = function(pageNumber) {
                $scope.page.number = pageNumber;
                if ($scope.lastPage > 10 && $scope.page.number > 6 && $scope.page.number < ($scope.lastPage - 4)) {
                    $scope.pages.forEach(function(element, index, array) {
                        array[index] = $scope.page.number - (5 - index);
                    });
                } else if ($scope.lastPage > 10 && $scope.page.number >= ($scope.lastPage - 4)) {
                    $scope.pages.forEach(function(element, index, array) {
                        array[index] = $scope.lastPage - (9 - index);
                    });
                } else {
                    $scope.pages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                }
                    if ($scope.useGroundTruth) {
                        $scope.page.subjects =
                            subjectIDs.slice(($scope.page.number - 1) * pageSize, Math.min(clusterIDs.length, $scope.page.number * pageSize));
                        $scope.page.open = [];
                        for (var i = 0; i < $scope.page.subjects.length; i++) {
                            $scope.page.open.push($scope.expanded);
                        }
                    }
                    else
                        $scope.page.clusters =
                            clusterIDs.slice(($scope.page.number - 1) * pageSize, Math.min(clusterIDs.length, $scope.page.number * pageSize));

                window.scrollTo(0, 0);
            };

            $scope.averagePrecision = function(subject_id) {
                var total = 0.0;
                var clusters = $scope.subjectClusters[subject_id];
                clusters.forEach(function(cluster_id) {
                    total += $scope.clusters[cluster_id].precision;
                });

                return round(total/clusters.length, 2);
            };

            $scope.averageRecall = function(subject_id) {
                var total = 0.0;
                var clusters = $scope.subjectClusters[subject_id];
                clusters.forEach(function(cluster_id) {
                    total += $scope.clusters[cluster_id].recall;
                });

                return round(total/clusters.length, 2);
            };

            $scope.totalRecall = function(subject_id) {
                var total = 0.0;
                var clusters = $scope.subjectClusters[subject_id];
                clusters.forEach(function(cluster_id) {
                    total += $scope.clusters[cluster_id].recall;
                });

                return round(total, 3);
            };

            function parseClusters(csv) {

                var lines=csv.split("\n");
                $scope.clusters = {};
                $scope.templates = {};
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

                    if (!$scope.clusters[cluster_index]) {
                        $scope.clusters[cluster_index] = {};
                        $scope.clusters[cluster_index].templates = [];
                    }
                    $scope.clusters[cluster_index].templates.push(obj);

                    // create an empty entry in templates
                    $scope.templates[obj["TEMPLATE_ID"]] = {};

                }
            }

            var inputHeaders = ["FILENAME", "FACE_X", "FACE_Y", "FACE_WIDTH", "FACE_HEIGHT"];
            function parseTemplates(csv) {

                var lines=csv.split("\n");
                var headers=lines[0].split(",");
                var id_col = -1;

                headers.forEach(function(value, index, array) {
                    var v = value.trim();
                    array[index] = v;
                    if (v === "TEMPLATE_ID")
                        id_col = index;
                });

                for(var i = 1; i < lines.length; i++){ // skip header

                    if (lines[i] === "")
                        continue;

                    var obj = {};
                    var currentline = lines[i].split(",");
                    var template_id = currentline[id_col];
                    if ($scope.templates[template_id]) { // only process if template is used by clusters
                        for (var j = 0; j < headers.length; j++) {
                            if (inputHeaders.indexOf(headers[j]) !== -1) {
                                obj[headers[j]] = currentline[j];
                            }
                        }
                        $scope.templates[template_id] = obj;
                    }
                }
            }

            function parseGroundTruth(csv) {

                var lines=csv.split("\n");
                var headers=lines[0].split(",");
                var id_col = -1, subject_col = -1;
                $scope.subjects = {};
                $scope.subjectClusters = {};

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
                    if ($scope.templates[template_id]) { // only care if template is used
                        $scope.templates[template_id].SUBJECT_ID = subject_id;

                        if ($scope.subjects[subject_id]) {// subject already created
                            $scope.subjects[subject_id].push(template_id);
                        }
                        else {
                            $scope.subjects[subject_id] = [template_id]; // create new entry
                        }
                    }
                }


            }

            /**
             * calculate precision and recall of each cluster
             */
            function calculatePrecision() {

                var i;
                $scope.subjectClusters = {};

                for (var cid in $scope.clusters) {

                    var cluster = $scope.clusters[cid];

                    // find subjects in the cluster
                    var subjects = {};
                    for (i = 0; i < cluster.templates.length; i++) {
                        var template_id = cluster.templates[i]["TEMPLATE_ID"];
                        var subject_id = $scope.templates[template_id]["SUBJECT_ID"];
                        if (subjects[subject_id])
                            subjects[subject_id] = subjects[subject_id] += 1;
                        else
                            subjects[subject_id] = 1;
                    }

                    // find main subject
                    var mainSubjects = []; // count equal then cluster has more than one main subject
                    var clusterSubjectCount = -1; // max
                    for (var s in subjects) {
                        if (mainSubjects.length === 0 || subjects[s] > clusterSubjectCount) { // first s or found a new max count
                            mainSubjects = [s];
                            clusterSubjectCount = subjects[s];
                        } else if (subjects[s] === clusterSubjectCount) { // equal max count, add subject
                            mainSubjects.push(s);
                        }
                    }

                    var mainSubject = null;
                    if (mainSubjects.length > 1) {
                        // TODO determine the main subject
                        mainSubject = mainSubjects[0];
                    } else {
                        mainSubject = mainSubjects[0];
                    }

                    // calculate precision
                    var subjectCount = $scope.subjects[mainSubject].length;
                    cluster.precision = round(clusterSubjectCount / cluster.templates.length, 2);

                    // calculate recall
                    cluster.recall = round(clusterSubjectCount / subjectCount, 2);

                    // mark correctness
                    for (i = 0; i < cluster.templates.length; i++) {
                        cluster.templates[i].match = $scope.templates[cluster.templates[i]['TEMPLATE_ID']]['SUBJECT_ID'] === mainSubject;
                    }

                    // map clusters to subject
                    if ($scope.subjectClusters[mainSubject]) {
                        $scope.subjectClusters[mainSubject].push(cid);
                    } else {
                        $scope.subjectClusters[mainSubject] = [cid];
                    }
                }
            }

            function round(value, decimals) {
                return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
            }

        }])

})();
