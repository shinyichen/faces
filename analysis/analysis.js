(function() {

    angular.module('analysis', ['ui.bootstrap', 'd3', 'fileInput', 'images'])

        .controller('analysisController', ['$scope', '$rootScope', function($scope, $rootScope) {

            $scope.imageDir = "../..";

            $scope.template = null; // template

            $scope.$on("selection", function(event, image_name) {

                // find matching template
                $scope.template = $rootScope.filenameToTemplate[image_name];
                var s_t = $rootScope.subjects[$scope.template["SUBJECT_ID"]]; // images in of the same subject

                // templates of the same subject
                $scope.subject_templates = [];
                for (var i = 0; i < s_t.length; i++) {
                    $scope.subject_templates.push($rootScope.templates[s_t[i]]);
                }

                // same cluster
                $rootScope.cluster_templates = [];
                var cid = $scope.template["CLUSTER_INDEX"];
                var c_t = $rootScope.clusters[cid].templates;
                for (var j = 0; j < c_t.length; j++) {
                    $scope.cluster_templates.push($rootScope.templates[c_t[j]["TEMPLATE_ID"]]);
                }
                $scope.$apply();
            })
        }])

        .run(['$rootScope', '$http', function($rootScope, $http) {

            $rootScope.dataset = [];

            $rootScope.data_ready = false;


            var preset = "clusters_32";

            var input = "../data/" + preset + "/hint.csv";

            var inputText = null;

            $rootScope.filenameToTemplate = {};

            var clustersFile = "../data/" + preset + "/clusters.txt";

            var clustersText = null;

            var gt = "../data/ground_truth.csv";

            var groundTruthText = null;

            $rootScope.clusters = {};

            var clusterIDs;

            var subjectIDs;

            var subjectClusters;

            var data_file = "../data/analysis/2d_32.txt";

            var group_file = "../data/analysis/labels_32.txt";

            var id_file = "../data/analysis/img_32.txt";

            var data, groups, ids;

            loadPreset();
            initGraph();

            function loadPreset() {
                $http.get(input).then(function(response) {
                    inputText = response.data;
                    return $http.get(clustersFile);
                }, function(error) {
                }).then(function(response) {

                    clustersText = response.data;
                    $http.get(gt).then(function(r) {
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
                clusterIDs = Object.keys($rootScope.clusters);

                // input file
                parseTemplates(inputText);

                // ground truth
                parseGroundTruth(groundTruthText);
                subjectIDs = Object.keys($rootScope.subjects);
            }

            function parseClusters(csv) {

                var lines=csv.split("\n");
                $rootScope.clusters = {};
                $rootScope.templates = {};
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

                    if (!$rootScope.clusters[cluster_index]) {
                        $rootScope.clusters[cluster_index] = {};
                        $rootScope.clusters[cluster_index].templates = [];
                    }
                    $rootScope.clusters[cluster_index].templates.push(obj);

                    // create an empty entry in templates
                    $rootScope.templates[obj["TEMPLATE_ID"]] = {
                        "CLUSTER_INDEX": cluster_index
                    };

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

                    var currentline = lines[i].split(",");
                    var template_id = currentline[id_col];
                    if ($rootScope.templates[template_id]) { // only process if template is used by clusters
                        for (var j = 0; j < headers.length; j++) {
                            if (inputHeaders.indexOf(headers[j]) !== -1) {
                                $rootScope.templates[template_id][headers[j]] = currentline[j];
                            }
                        }
                        var filename = $rootScope.templates[template_id]["FILENAME"].match(/([^.]+)..*/)[1];
                        $rootScope.filenameToTemplate[filename] = $rootScope.templates[template_id];
                    }
                }
            }

            function parseGroundTruth(csv) {

                var lines=csv.split("\n");
                var headers=lines[0].split(",");
                var id_col = -1, subject_col = -1;
                $rootScope.subjects = {};
                subjectClusters = {};

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
                    if ($rootScope.templates[template_id]) { // only care if template is used
                        $rootScope.templates[template_id].SUBJECT_ID = subject_id;

                        if ($rootScope.subjects[subject_id]) {// subject already created
                            $rootScope.subjects[subject_id].push(template_id);
                        }
                        else {
                            $rootScope.subjects[subject_id] = [template_id]; // create new entry
                        }
                    }
                }
            }

            function initGraph () {
                $http.get(data_file).then(function (response) {
                    // parse array
                    data = parse2D(response.data);

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

                    // combine data and label and create dataset
                    for (var r = 0; r < data.length; r++) { // rows
                        $rootScope.dataset[r] = {
                            "x": data[r][0],
                            "y": data[r][1],
                            "group": groups[r],
                            "id": ids[r]
                        }
                    }

                    // allow drawing to begin
                    $rootScope.data_ready = true;
                });
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
        }])

        .directive('plot', ['d3Service', function (d3Service) {
            return {
                restrict: 'E',
                scope: {
                    dataset: "=",
                    labels: "="
                },
                link: function(scope, element, attrs) {

                    d3Service.d3().then(function(d3) {

                        var colors = {};

                        var w = window.innerWidth/2, h = window.innerHeight, padding = 20, transform = d3.zoomIdentity;

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
                        function getColor(label) { // label is string of integer
                            if (!colors[label]) {
                                var color = '#';
                                for (var i = 0; i < 6; i++ ) {
                                    color += letters[Math.floor(Math.random() * 16)];
                                }
                                colors[label] = color
                            }

                            return colors[label];
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

                        g.selectAll("circle")
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
                                return getColor(d.group);
                            })
                            .on("click", clicked)
                            .call(d3.drag().on("drag", dragged));

                        //g.on("mousedown", function() {
                        //    var e = this,
                        //        origin = d3.mouse(e),
                        //        rect = svg.append("rect").attr("class", "zoom");
                        //    d3.select("body").classed("noselect", true);
                        //    origin[0] = Math.max(0, Math.min(w, origin[0]));
                        //    origin[1] = Math.max(0, Math.min(h, origin[1]));
                        //    d3.select(window)
                        //        .on("mousemove.zoomRect", function() {
                        //            var m = d3.mouse(e);
                        //            m[0] = Math.max(0, Math.min(w, m[0]));
                        //            m[1] = Math.max(0, Math.min(h, m[1]));
                        //            rect.attr("x", Math.min(origin[0], m[0]))
                        //                .attr("y", Math.min(origin[1], m[1]))
                        //                .attr("width", Math.abs(m[0] - origin[0]))
                        //                .attr("height", Math.abs(m[1] - origin[1]));
                        //        })
                        //        .on("mouseup.zoomRect", function() {
                        //            d3.select(window).on("mousemove.zoomRect", null).on("mouseup.zoomRect", null);
                        //            d3.select("body").classed("noselect", false);
                        //            var m = d3.mouse(e);
                        //            m[0] = Math.max(0, Math.min(w, m[0]));
                        //            m[1] = Math.max(0, Math.min(h, m[1]));
                        //            if (m[0] !== origin[0] && m[1] !== origin[1]) {
                        //                zoom.x(xScale.domain([origin[0], m[0]].map(xScale.invert).sort()))
                        //                    .y(yScale.domain([origin[1], m[1]].map(yScale.invert).sort()));
                        //            }
                        //            rect.remove();
                        //            //refresh();
                        //        }, true);
                        //    d3.event.stopPropagation();
                        //});

                        svg.call(d3.zoom()
                            .scaleExtent([1, 32])
                            .translateExtent([[0, 0], [w, h]])
                            .extent([[0, 0], [w, h]])
                            .on("zoom", zoomed));

                        // clicked on a dot
                        function clicked(d, i) {
                            d3.select(this).transition()
                                .style("fill", "black")
                                .transition()
                                .style("fill", getColor(d.group));

                            scope.$emit('selection', d.id);
                        }

                        function zoomed() {
                            g.attr("transform", d3.event.transform);
                        }

                        function dragged(d) {
                            d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
                        }

                    });
                }
            }
        }]);


})();
