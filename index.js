var http	= require('http'),
	parse	= require('url').parse,
	spawn	= require('child_process').spawn,
	jsdom	= require('jsdom');
	
var map = function(arr, func) {
	var i,
		results = [];
	
	for (i = 0; i < arr.length; i++) {
		results.push(func.apply(arr[i], [i]));
	}
	
	return results;
}

var createHighchartsWindow = function(fn) {
	var window 	= jsdom.jsdom().createWindow(),
		script	= window.document.createElement('script');
	
	// Convince Highcharts that our window supports SVG's
	window.SVGAngle = true;
	
	// jsdom doesn't yet support createElementNS, so just fake it up
	window.document.createElementNS = function(ns, tagName) {
		var elem = doc.createElement(tagName);	
		elem.getBBox = function() {
			return {
				x: elem.offsetLeft,
				y: elem.offsetTop,
				width: elem.offsetWidth,
				height: elem.offsetHeight
			};
		};
		return elem;
	};
	
	// Load scripts
	jsdom.jQueryify(window, function() {
		script.src = 'file://' + __dirname + '/highcharts/highcharts.src.js';
		script.onload = function() {
			if (this.readyState === 'complete') {
				fn(window);
			}
		}
	});
}

this.server = http.createServer(function(request, response) {
	var url 		= parse(request.url, true),
		chartTypeMatch 	= /^\/(\w+)$/.exec(url.pathname),
		chartType	= chartTypeMatch ? chartTypeMatch[1] : null,
		query		= (url.query || {}),
		width		= query.width || 640,
		height		= query.height || 480,
		data		= [];
		
	if (query.data) {
		map(query.data.split(','), function(i) {
			data.push(parseFloat(this));
		});
	}
	
	if (chartType == null || data.length == 0) {
		response.writeHeader(404, {'Content-Type': 'text/plain'});
		response.write('usage: /chartType?data=0,1,2,3');
		response.end();
		return;
	}
	
	createHighchartsWindow(function(window) {
		var $	= window.jQuery,
			Highcharts 	= window.Highcharts,
			document	= window.document,
			$container	= $('<div id="container" />'),
			chart, svg, convert;
		
		console.log('Generating ' + chartType + ' chart');
		
		$container.appendTo(document.body);
		
		chart = new Highcharts.Chart({
			chart: {
				defaultSeriesType: chartType,
				renderTo: $container[0],
				renderer: 'SVG',
				width: width,
				height: height
			},
			series: [{
				animation: false,
				data: data
			}]
		});
		
		svg = $container.children().html();
		
		// Start convert
		convert	= spawn('convert', ['svg:-', 'png:-']);

		// We're writing an image, hopefully...
		response.writeHeader(200, {'Content-Type': 'image/png'});
		
		// Pump in the svg content
		convert.stdin.write(svg);
		convert.stdin.end();
		
		// Write the output of convert straight to the response
		convert.stdout.on('data', function(data) {
			response.write(data);
		});

		// When we're done, we're done
		convert.on('exit', function(code) {
			response.end();	
		});
	});
	
}).listen(2308);

console.log('listening on 2308')