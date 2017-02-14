(function() {

    angular.module('analysis', ['ui.bootstrap', 'd3', 'fileInput', 'images', 'modals'])

        .controller('analysisController', ['$scope', '$http', '$uibModal', function($scope, $http, $uibModal) {

            $scope.imageDir = "../..";

            $scope.presets = ["clusters_32", "clusters_32_avg", "clusters_32_min", "clusters_64", "clusters_128", "clusters_256", "clusters_512", "clusters_1024", "clusters_1870"];

            $scope.formModel = {
                preset: null
            };

            $scope.template = null; // selected template

            $scope.cluster_id = null; // template's cluster

            $scope.subject_id = null; // template's subject

            $scope.plotInfo = {
                isBySubject : true,
                viewSingleGroup: false,
                viewSubjectClusters: false
            };

            $scope.view = "opener"; // opener, overview, cluster, subject

            $scope.dataset = [];

            $scope.data_ready = false;

            $scope.clusters = {};

            $scope.subjectClusters = {};

            var template_file;

            var vector_file;

            var group_file;

            var id_file;

            var cluster_file;

            var gt_file = "../data/ground_truth.csv";

            var templateText = null;

            var filenameToTemplate = {};

            var clustersText = null;

            var groundTruthText = null;

            var clusterIDs;

            var subjectIDs;

            var vector, groups, ids;

            $scope.open = function() {
                $scope.preset = $scope.formModel.preset;
                template_file = "../data/" + $scope.preset + "/hint.csv";
                vector_file = "../data/analysis/" + $scope.preset + "_2d.txt";
                group_file = "../data/analysis/" + $scope.preset + "_labels.txt";
                id_file = "../data/analysis/" + $scope.preset + "_img.txt";
                cluster_file = "../data/" + $scope.preset + "/clusters.txt";

                loadPreset();
                initGraph();
                $scope.view = "overview";
            };

            $scope.$on("selection", function(event, image_name) {

                // find matching template
                $scope.template = filenameToTemplate[image_name];
                $scope.subject_id = $scope.template["SUBJECT_ID"];
                $scope.cluster_id = $scope.template["CLUSTER_INDEX"];
                var s_t = $scope.subjects[$scope.subject_id]; // images in of the same subject

                // templates of the same subject
                $scope.subject_templates = [];
                for (var i = 0; i < s_t.length; i++) {
                    $scope.subject_templates.push($scope.templates[s_t[i]]);
                }

                // same cluster
                $scope.cluster_templates = [];
                var c_t = $scope.clusters[$scope.cluster_id].templates;
                for (var j = 0; j < c_t.length; j++) {
                    $scope.cluster_templates.push($scope.templates[c_t[j]["TEMPLATE_ID"]]);
                }
                $scope.$apply();
            });

            $scope.showImage = function(template, match) {

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

            $scope.showOverview = function() {
                $scope.view = "overview";
            };

            $scope.showCluster = function() {
                $scope.view = "cluster";
            };

            $scope.showSubject = function() {
                $scope.view = "subject";
            };

            $scope.bySubject = function() {
                $scope.plotInfo.isBySubject = true;
            };

            $scope.byCluster = function() {
                $scope.plotInfo.isBySubject = false;
            };

            var averagePrecisions = {};
            $scope.averagePrecision = function(subject_id) {
                if (!averagePrecisions[subject_id]) {
                    var total = 0.0;
                    var clusters = $scope.subjectClusters[subject_id];
                    clusters.forEach(function(cluster_id) {
                        total += $scope.clusters[cluster_id].precision;
                    });

                    averagePrecisions[subject_id] = round(total/clusters.length, 2);
                }

                return averagePrecisions[subject_id];
            };

            var averageRecalls = {};
            $scope.averageRecall = function(subject_id) {
                if (!averageRecalls[subject_id]) {
                    var total = 0.0;
                    var clusters = $scope.subjectClusters[subject_id];
                    clusters.forEach(function(cluster_id) {
                        total += $scope.clusters[cluster_id].recall;
                    });

                    averageRecalls[subject_id] = round(total/clusters.length, 2);
                }

                return averageRecalls[subject_id];
            };

            var totalRecalls = {};
            $scope.totalRecall = function(subject_id) {
                if (!totalRecalls[subject_id]) {
                    var total = 0.0;
                    var clusters = $scope.subjectClusters[subject_id];
                    clusters.forEach(function(cluster_id) {
                        total += $scope.clusters[cluster_id].recall;
                    });

                    totalRecalls[subject_id] = round(total, 3);
                }

                return totalRecalls[subject_id];
            };

            function loadPreset() {
                $http.get(template_file).then(function(response) {
                    templateText = response.data;
                    return $http.get(cluster_file);
                }, function(error) {
                }).then(function(response) {

                    clustersText = response.data;
                    $http.get(gt_file).then(function(r) {
                        groundTruthText = r.data;
                        load();
                    }, function(error) {
                    });
                }, function(error) {
                });
            }

            function load() {
                // result file
                parseClusters(clustersText);
                clusterIDs = Object.keys($scope.clusters);

                // input file
                parseTemplates(templateText);

                // ground truth
                parseGroundTruth(groundTruthText);
                subjectIDs = Object.keys($scope.subjects);
                calculatePrecision();
            }

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
                    obj["CONFIDENCE"] = Number(obj["CONFIDENCE"]); // convert confidence to number

                    if (!$scope.clusters[cluster_index]) {
                        $scope.clusters[cluster_index] = {};
                        $scope.clusters[cluster_index].templates = [];
                    }
                    $scope.clusters[cluster_index].templates.push(obj);

                    // create an empty entry in templates
                    $scope.templates[obj["TEMPLATE_ID"]] = {
                        "CLUSTER_INDEX": cluster_index
                    };

                }
            }

            var inputHeaders = ["TEMPLATE_ID", "FILENAME", "FACE_X", "FACE_Y", "FACE_WIDTH", "FACE_HEIGHT"];
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

                    var currentline = lines[i].split(",");
                    var template_id = currentline[id_col];
                    if ($scope.templates[template_id]) { // only process if template is used by clusters
                        for (var j = 0; j < headers.length; j++) {
                            if (inputHeaders.indexOf(headers[j]) !== -1) {
                                $scope.templates[template_id][headers[j]] = currentline[j];
                            }
                        }
                        var filename = $scope.templates[template_id]["FILENAME"].match(/([^.]+)..*/)[1];
                        filenameToTemplate[filename] = $scope.templates[template_id];
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
                            $scope.subjectClusters[subject_id] = [];
                        }
                    }
                }
            }

            function initGraph () {
                $http.get(vector_file).then(function (response) {
                    // parse array
                    vector = parse2D(response.data);

                    return $http.get(group_file);

                }, function (error) {
                    // parse 2d.txt failed
                }).then(function (response) {
                    // parse labels
                    groups = parseLabels(response.data);

                    return $http.get(id_file);
                }, function (error) {
                    // parse labels.txt failed
                }).then(function (response) {

                    ids = parseLabels(response.data);

                    // combine vector and label and create dataset
                    for (var r = 0; r < vector.length; r++) { // rows

                        $scope.dataset[r] = {
                            "x": vector[r][0],
                            "y": vector[r][1],
                            "group": groups[r],
                            "cluster": filenameToTemplate[ids[r]]["CLUSTER_INDEX"],
                            "id": ids[r]
                        }
                    }

                    console.log($scope.dataset);

                    // allow drawing to begin
                    $scope.data_ready = true;
                });
            }

            function calculatePrecision() {

                var i;

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

                    for (i = 0; i < cluster.templates.length; i++) {
                        $scope.templates[template_id].guessed_subject = mainSubject;
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

            function parse2D(csv) {

                var data = [];

                var lines=csv.split("\n");

                for(var i = 0; i < lines.length; i++){

                    if (lines[i] === "")
                        continue;

                    var currentline = lines[i].split(",");
                    var c = currentline.length;
                    var line = [];
                    for (var j = 0; j < c; j++){
                        line.push(Number(currentline[j]));
                    }

                    data.push(line);

                }

                return data;
            }

            function parseLabels(csv) {

                var labels = [];

                var lines=csv.split("\n");

                for (var i = 0; i < lines.length; i++){
                    labels.push(lines[i]);
                }

                return labels;
            }

            function round(value, decimals) {
                return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
            }
        }])

        .directive('plot', ['d3Service', function (d3Service) {
            return {
                restrict: 'E',
                scope: {
                    dataset: "=",
                    plotInfo: "="
                },
                link: function(scope, element, attrs) {

                    var isBySubject = true;

                    var viewSingleGroup = false;

                    var viewSubjectCluster = false;

                    var selectedDot;

                    var selectedData;

                    d3Service.d3().then(function(d3) {

                        var clusterColors = {};
                        var subjectColors = {};

                        var w = (window.innerWidth/12)*9, h = window.innerHeight-50, padding = 50, transform = d3.zoomIdentity;

                        // scale functions to make data fit in the viewport
                        var xScale = d3.scaleLinear()
                            .domain([d3.min(scope.dataset, function(d) { return d.x; }),
                                d3.max(scope.dataset, function(d) { return d.x; })])
                            .range([padding, w - padding * 2]);

                        var yScale = d3.scaleLinear()
                            .domain([d3.min(scope.dataset, function(d) { return d.y; }),
                                d3.max(scope.dataset, function(d) { return d.y; })])
                            .range([h - padding, padding]);

                        // color function (label->color)
                        var letters = '0123456789ABCDEF';
                        function getColor(datapoint) { // label is string of integer
                            var color, i;
                            // if viewing by clusters, or a single subject and color by cluster
                            if ((selectedData && viewSingleGroup && isBySubject && viewSubjectCluster) || !isBySubject) {
                                if (!clusterColors[datapoint.cluster]) {
                                    color = '#';
                                    for (i = 0; i < 6; i++) {
                                        color += letters[Math.floor(Math.random() * 16)];
                                    }
                                    clusterColors[datapoint.cluster] = color;
                                }

                                return clusterColors[datapoint.cluster];
                            } else { // viewing by subject color by subject
                                if (!subjectColors[datapoint.group]) {
                                    color = '#';
                                    for (i = 0; i < 6; i++) {
                                        color += letters[Math.floor(Math.random() * 16)];
                                    }
                                    subjectColors[datapoint.group] = color;
                                }

                                return subjectColors[datapoint.group];

                            }
                        }

                        var svg = d3.select(element[0]).append("svg");
                        svg.attr("width", w)
                            .attr("height", h);

                        // border
                        svg.append("rect")
                            .attr("x", 0)
                            .attr("y", 0)
                            .attr("height", h)
                            .attr("width", w)
                            .style("stroke", "black")
                            .style("fill", "none")
                            .style("stroke-width", 1);


                        var g = svg.append("g");

                        var circles = g.selectAll("circle")
                            .data(scope.dataset)
                            .enter().append("circle")
                            .attr("cx", function(d) {
                                return xScale(d.x);
                            })
                            .attr("cy", function(d) {
                                return yScale(d.y);
                            })
                            .attr("r", 1)
                            .attr('fill', function(d) {
                                return getColor(d);
                            })
                            .on("click", clicked)
                            .call(d3.drag().on("drag", dragged));

                        var zoom = d3.zoom()
                            .scaleExtent([1, 32])
                            .translateExtent([[0, 0], [w, h]])
                            .extent([[0, 0], [w, h]])
                            .on("zoom", zoomed);
                        svg.call(zoom);

                        // clicked on a dot
                        function clicked(d, i) {
                            if (selectedDot)
                                d3.select(selectedDot).attr("r", 1)
                                    .style("fill-opacity", null); // reset previous selection
                            selectedDot = this;
                            selectedData = d;
                            d3.select(this).moveToBack();
                            update();
                            scope.$emit('selection', d.id);
                        }

                        function zoomed() {
                            g.attr("transform", d3.event.transform);
                        }

                        function dragged(d) {
                            d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
                        }

                        function update() {
                            g.selectAll("circle")
                                .attr("r", function(d) {
                                    if (selectedData) {
                                        if (viewSingleGroup) { // only show subject or cluster
                                            if (isBySubject && (d.group !== selectedData.group))
                                                return 0;
                                            if (!isBySubject && (d.cluster !== selectedData.cluster))
                                                return 0;
                                        }
                                        if (d.id === selectedData.id)
                                            return 10;
                                        // if in the same cluster of subject, indicate as well
                                        if (isBySubject && (d.group === selectedData.group)) {
                                            return 3;
                                        } else if (!isBySubject && (d.cluster === selectedData.cluster)) {
                                            return 3;
                                        }
                                        return 1;
                                    }

                                    return 1;
                                })
                                .attr("fill-opacity", function(d) {
                                    if (selectedData && d.id === selectedData.id)
                                        return 0.8;
                                    return 1;
                                })
                                .attr('fill', function(d) {
                                    return getColor(d);
                                });
                        }

                        d3.selection.prototype.moveToBack = function() {
                            return this.each(function() {
                                var firstChild = this.parentNode.firstChild;
                                if (firstChild) {
                                    this.parentNode.insertBefore(this, firstChild);
                                }
                            });
                        };

                        scope.$watch('plotInfo.isBySubject', function(newValue, oldValue) {
                            if (newValue !== undefined && newValue !== null) {
                                isBySubject = newValue;
                                update();
                            }
                        });

                        scope.$watch('plotInfo.viewSingleGroup', function(newValue, oldValue) {
                            if (newValue !== undefined && newValue !== null) {
                                viewSingleGroup = newValue;
                                update();
                            }
                        });

                        scope.$watch('plotInfo.viewSubjectClusters', function(newValue, oldValue) {
                            if (newValue !== undefined && newValue !== null) {
                                viewSubjectCluster = newValue;
                                update();
                            }
                        });

                    });


                }
            }
            
        }]);


})();
