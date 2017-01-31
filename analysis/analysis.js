(function() {

    angular.module('analysis', ['ui.bootstrap', 'd3'])

        .controller('analysisController', ['$scope', function($scope) {

            $scope.data = [
                [208.4496,49.9103,116.0087,124.0512,255.8,109.4,290.4,102.2,281.2],
                [184.5774,33.6473,112.6158,139.1008,223.4,101,259.2,102.8,244.8333],
                [217.0703,30.9861,111.5802,134.4262,281,92.8,314.2,93.2,302],
                [249.1775,43.7677,112.2971,137.9715,285.4,105.2,321.2,104.8,304.8],
                [172.2057,38.5473,135.0278,142.1372,234.5,985.34,208.75,105.75,190.25],
                [243.8153,42.2475,111.344,135.2994,265.6,101,297.4,104,276.4],
                [231.482,42.635,110.794,134.4729,291.8333,103.8333,326,102.3333,317.8],
                [403.2499,20.8412,52.2246,51.8056,245.2,2344.83,417.9,51.9,411.0769],
                [224.6625,23.5375,113.2343,135.0538,260.6,85.2,298.8,89,278],
                [225.8184,39.6273,113.9054,134.4018,285.4,99.6,319,101.6,306.75]
            ];


        }])

        .directive('plot', ['d3service', function (d3service) {
            return {
                restrict: 'E',
                scope: {
                    dataset: "="
                },
                link: function(scope, element, attrs) {

                    var T, opt;

                    var svg, w=1000, h=1000;

                    function initEmbedding() {
                        svg = d3service.select(element[0])
                            .append("svg") 
                            .attr("width", w)
                            .attr("height", h);

                        svg.append("rect")
                            .attr("x", 0)
                            .attr("y", 0)
                            .attr("height", h)
                            .attr("width", w)
                            .style("stroke", "black")
                            .style("fill", "none")
                            .style("stroke-width", 1);
                    }

                    function updateEmbedding() {

                        // get current solution
                        var Y = T.getSolution();

                        // move the groups accordingly
                        gs.attr("transform", function(d, i) { return "translate(" +
                            ((Y[i][0]*20*ss + tx) + 400) + "," +
                            ((Y[i][1]*20*ss + ty) + 400) + ")"; });

                    }

                    var gs;
                    var cs;
                    var ts;
                    function drawEmbedding() {

                        gs = svg.selectAll(".b")
                            .data(scope.dataset)
                            .enter().append("g")
                            .attr("class", "u");

                        cs = gs.append("circle")
                            .attr("cx", 0)
                            .attr("cy", 0)
                            .attr("r", 5)
                            .attr('stroke-width', 1)
                            .attr('stroke', 'black')
                            .attr('fill', 'rgb(100,100,255)');


                        var zoomListener = d3service.behavior.zoom()
                            .scaleExtent([0.1, 10])
                            .center([0,0])
                            .on("zoom", zoomHandler);
                        zoomListener(svg);
                    }

                    var tx=0, ty=0;
                    var ss=1;
                    function zoomHandler() {
                        tx = d3service.event.translate[0];
                        ty = d3service.event.translate[1];
                        ss = d3service.event.scale;
                    }

                    function step() {
                        T.step(); // do a few steps
                        updateEmbedding();
                    }



                    initEmbedding();

                    // ok lets do this
                    opt = {epsilon: 10, dim: scope.dataset[0].length};
                    T = new tsnejs.tSNE(opt); // create a tSNE instance

                    T.initDataRaw(scope.dataset);
                    drawEmbedding();
                    setInterval(step, 10);

                }
            }
        }]);


})();
