var hc = require('../lib/node-highcharts'),
	fs = require('fs'),
	options = {
		chart: {
			defaultSeriesType: 'column',
			renderTo: 'container',
			renderer: 'SVG',
			width: 800,
			height: 600
		},
		series: [{
			animation: false,
			data: [1,2,3,4,5]
		}]
	};
	
hc.render(options, function(result, err) {
	fs.writeFile('chart.png', result, function() { console.log('done'); });
});