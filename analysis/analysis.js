(function() {

    angular.module('analysis', ['ui.bootstrap', 'd3', 'fileInput'])

        .controller('analysisController', [function() {

        }])

        .run(['$rootScope', '$http', function($rootScope, $http) {

            $rootScope.dataset = [];

            $rootScope.data_ready = false;


            var data_file = "../data/analysis/2d.txt";

            var label_file = "../data/analysis/labels.txt";

            var data, labels;

            $http.get(data_file).then(function(response) {
                // parse array
                data = parse2D(response.data);

                return $http.get(label_file);

            }, function(error) {
                // parse 2d.txt failed
            }).then(function(response) {
                // parse labels
                labels = parseLabels(response.data);

                // combine data and label and create dataset
                for (var r = 0; r < data.length; r++) { // rows
                    $rootScope.dataset[r] = {
                        "x": data[r][0],
                        "y": data[r][1],
                        "label": labels[r]
                    }
                }

                // allow drawing to begin
                $rootScope.data_ready = true;
            }, function(error) {
                // parse labels.txt failed
            });

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

                        var w = 1000, h = 700, padding = 20, transform = d3.zoomIdentity;

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
                                return getColor(d.label);
                            })
                            .call(d3.drag().on("drag", dragged));

                        svg.call(d3.zoom()
                            .scaleExtent([1, 32])
                            .translateExtent([[0, 0], [w, h]])
                            .extent([[0, 0], [w, h]])
                            .on("zoom", zoomed));

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
