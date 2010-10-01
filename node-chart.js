var fs = require('fs'),
	jsdom  = require("./jsdom/lib/jsdom.js"),
    window = jsdom.jsdom().createWindow();

jsdom.jQueryify(window, function() {
	var i,
		scripts = [
		'file://' + __dirname + '/highcharts/highcharts.src.js',
		'file://' + __dirname + '/highcharts/exporting.src.js'
	];
	window.SVGAngle = true;
	window.console = {
		log: console.log
	};
	var script = window.document.createElement("script");

	script.src = scripts[0];
	
	script.onload = function() {
		if (this.readyState === 'complete') {
			var script = window.document.createElement("script");
			
			script.src = scripts[1];
			
			script.onload = function() {
				var $ = window.jQuery,
					$container = $('<div id="container" />'),
					Highcharts = window.Highcharts,
					svg,
					chart;
				
				//window.document.readyState = 'complete';
				window.document.createElementNS = function(ns, tagName) {
					var element = doc.createElement(tagName);
					element.getBBox = function() {
						var ret,
							hasOffsetWidth = element.offsetWidth,
							origParentNode = element.parentNode;

						if (!hasOffsetWidth) {
							doc.body.appendChild(element);
						} 
						ret = {
							x: element.offsetLeft || 10,
							y: element.offsetTop || 10,
							width: element.offsetWidth || 10,
							height: element.offsetHeight || 10
						};

						if (!hasOffsetWidth) {
							if (origParentNode) {
								origParentNode.appendChild(element);
							} else {
								doc.body.removeChild(element);
							}
						}
						console.log(ret);
						return ret;
					};
					return element;
				};
				$container.appendTo(window.document.body);
				
				
				chart = new Highcharts.Chart({
					chart: {
				        renderTo: $container[0],
						renderer: 'SVG',
						width: 640,
						height: 480,
						events: {
							load: function() { console.log('loaded');}
						}
				    },
					exporting: {
						enabled: false
					},
				    series: [{
				        data: [[0,0],[1,1],[2,2],[3,3],[4,2],[5,1],[6,0]],
						animation: false
				    }],
					xAxis: {
						min: 0,
						max: 6
					},
					yAxis: {
						min: 0,
						max: 5
					}
				});
				
				
				svg = $container.children().html();
				// sanitize
				svg = svg.
					replace(/zIndex="[^"]+"/g, ''). 
					replace(/isShadow="[^"]+"/g, '').
					replace(/symbolName="[^"]+"/g, '').
					replace(/jQuery[0-9]+="[^"]+"/g, '').
					replace(/isTracker="[^"]+"/g, '').
					replace(/url\([^#]+#/g, 'url(#').

					// IE specific
					replace(/id=([^" >]+)/g, 'id="$1"'). 
					replace(/class=([^" ]+)/g, 'class="$1"').
					replace(/ transform /g, ' ').
					replace(/:path/g, 'path').
					replace(/style="([^"]+)"/g, function(s) {
						return s.toLowerCase();
					});
				fs.writeFile('chart2.svg', svg);
			};
		}
	};
});