(function() {

    angular.module('analysis', ['ui.bootstrap', 'd3', 'fileInput'])

        .controller('analysisController', [function() {

        }])

        .run(['$rootScope', '$http', function($rootScope, $http) {

            $rootScope.data = [];

            $rootScope.data_ready = false;


            var data_file = "../data/analysis/2d.txt";

            $http.get(data_file).then(function(response) {
                $rootScope.data = parse(response.data);
                $rootScope.data_ready = true;
            }, function(error) {
            });

            function parse(csv) {

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
        }])

        .directive('plot', ['d3Service', function (d3Service) {
            return {
                restrict: 'E',
                scope: {
                    dataset: "="
                },
                link: function(scope, element, attrs) {

                    d3Service.d3().then(function(d3) {
                        var w = 1000, h = 700, padding = 20, transform = d3.zoomIdentity;

                        // scale functions to make data fit in the viewport
                        var xScale = d3.scaleLinear()
                            .domain([d3.min(scope.dataset, function(d) { return d[0]; }),
                                     d3.max(scope.dataset, function(d) { return d[0]; })])
                            .range([padding, w - padding * 2]);

                        var yScale = d3.scaleLinear()
                            .domain([d3.min(scope.dataset, function(d) { return d[1]; }),
                                     d3.max(scope.dataset, function(d) { return d[1]; })])
                            .range([h - padding, padding]);

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
                                return xScale(d[0]);
                            })
                            .attr("cy", function(d) {
                                return yScale(d[1]);
                            })
                            .attr("r", 1)
                            .attr('fill', 'rgb(100,100,255)')
                            //.attr("transform", "translate(" + w/2 + "," + h/2 + ")") // center
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
