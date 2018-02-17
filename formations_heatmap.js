document.addEventListener('DOMContentLoaded', function () {
    d3.json('formations.json', function (jsonData) {
        var colors = [
            '#ffffe5',
            '#f7fcb9',
            '#d9f0a3',
            '#addd8e',
            '#78c679',
            '#41ab5d',
            '#238443',
            '#006837',
            '#004529'
        ];
        var colorScale;

        var cellSize = 25;
        var margin = {top: 70, right: 50, bottom: 50, left: 70},
            legendWidth = 200,
            width = cellSize * jsonData.formations.length,
            height = cellSize * jsonData.formations.length;

        var axisLabels = {
            percentage: {
                home_win: {
                    yAxis: '(% of games won)',
                    xAxis: '(% of games lost)'
                },
                draw: {
                    yAxis: '(% of games drawn)',
                    xAxis: '(% of games drawn)'
                },
                away_win: {
                    yAxis: '(% of games lost)',
                    xAxis: '(% of games won)'
                }
            },
            counts: {
                home_win: {
                    yAxis: '(# of games won)',
                    xAxis: '(# of games lost)'
                },
                draw: {
                    yAxis: '(# of games drawn)',
                    xAxis: '(# of games drawn)'
                },
                away_win: {
                    yAxis: '(# of games lost)',
                    xAxis: '(# of games won)'
                }
            }
        };

        var svg = d3.select('#chart')
            .append('svg')
            .attr('width', width + margin.left + margin.right + legendWidth)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var legendSvg = d3.select('svg')
            .append('g')
            .attr('transform', 'translate(' + (width + margin.left + margin.right) + ',' + margin.top + ')');

        svg.append('g')
            .selectAll()
            .data(jsonData.formations)
            .enter()
            .append('text')
            .text(function (d) {
                return d;
            })
            .attr('x', 0)
            .attr('y', function (d, i) {
                return i * cellSize;
            })
            .style('text-anchor', 'end')
            .attr('transform', 'translate(-6,' + cellSize / 1.5 + ')')
            .attr('class', 'mono');

        svg.append('g')
            .selectAll()
            .data(jsonData.formations)
            .enter()
            .append('text')
            .text(function (d) {
                return d;
            })
            .attr('x', 0)
            .attr('y', function (d, i) {
                return i * cellSize;
            })
            .style('text-anchor', 'left')
            .attr('transform', 'translate(' + cellSize / 2 + ',-6) rotate (-90)')
            .attr('class', 'mono');

        var xLabel = svg
            .append('g')
            .attr('transform', 'translate(' + width / 2 + ',-55)')
            .append('text')
            .attr('class', 'axis')
            .text('x-axis label');

        var yLabel = svg
            .append('g')
            .attr('transform', 'translate(-55,' + height / 2 + ')')
            .append('text')
            .attr('class', 'axis')
            .attr('transform', 'rotate(-90)')
            .text('y-axis label');

        var heatMap = svg.append('g').attr('class', 'heatmap');

        var getControlValues = function () {
            return {
                type: d3.select('input[name="heatmap_type"]:checked').property('value'),
                outcome: d3.select('#select_outcome').property('value')
            };
        };

        function update(data) {
            var t = d3.transition().duration(750);

            heatMap
                .selectAll('g')
                .data(data)
                .enter()
                .append('g')
                .attr('transform', function (d) {
                    return 'translate(' + d.x * cellSize + ',' + d.y * cellSize + ')';
                })
                .on('mouseover', function (d) {
                    var formations = jsonData.formations[d.y] + ' vs. ' + jsonData.formations[d.x];
                    var value = Math.round(d.value);
                    var controlValues = getControlValues();

                    var valueString = (controlValues.type === 'percentage') ? '% of the games.' : ' games in total.';
                    if (controlValues.outcome === 'home_win') {
                        valueString = 'Home team won ' + '<strong>' + value + '</strong>' + valueString;
                    } else if (controlValues.outcome === 'away_win') {
                        valueString = 'Away team won ' + '<strong>' + value + '</strong>' + valueString;
                    } else if (controlValues.outcome === 'draw') {
                        valueString = 'Teams drew ' + '<strong>' + value + '</strong>' + valueString;
                    } else {
                        valueString = '<strong>' + value + '</strong>' + ' total games played.';
                    }

                    var tooltip = [
                        'Formations: ', '<strong>', formations, '</strong>',
                        '<br />',
                        valueString
                    ];

                    d3.select('#tooltip')
                        .classed('hidden', false)
                        .style('left', (d3.event.pageX + 10) + 'px')
                        .style('top', (d3.event.pageY - 10) + 'px')
                        .html(tooltip.join(''));
                })
                .on('mouseout', function () {
                    d3.select('#tooltip').classed('hidden', true);
                });

            heatMap
                .selectAll('g')
                .select('rect')
                .remove();

            heatMap
                .selectAll('g')
                .append('rect')
                .attr('class', 'cell cell-border')
                .attr('width', cellSize)
                .attr('height', cellSize)
                .style('fill', colors[0])
                .transition(t)
                .style('fill', function (d) {
                    return colorScale(d.value);
                });
        }

        var onInputChange = function () {
            var controlValues = getControlValues();
            var key;
            if (controlValues.outcome === 'overall_count') {
                key = 'overall_counts';
                xLabel.text('Away team formation');
                yLabel.text('Home team formation');

                d3.select('.heatmap-types-radios').style('display', 'none');
            } else {
                key = controlValues.outcome + '_' + controlValues.type;

                var labels = axisLabels[controlValues.type][controlValues.outcome];
                xLabel.text('Away team formation ' + labels.xAxis);
                yLabel.text('Home team formation ' + labels.yAxis);

                d3.select('.heatmap-types-radios').style('display', 'inline-block');
            }

            // Update heatmap
            colorScale = d3.scaleQuantile()
                .domain([jsonData[key].min, jsonData[key].max])
                .range(colors);
            update(jsonData[key].data);

            // Update legend
            var legend = d3.legendColor()
                .labelFormat(d3.format(".0f"))
                .scale(colorScale);

            legendSvg.select('.legend').remove();
            legendSvg.append('g')
                .attr('class', 'legend')
                .call(legend);
        };

        d3.select('#select_outcome').on('change', onInputChange);
        d3.selectAll('input[name="heatmap_type"]').on('change', onInputChange);

        onInputChange();
    });
});
