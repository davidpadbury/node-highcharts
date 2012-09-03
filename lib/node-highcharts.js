var jsdom = require('jsdom'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    jquery = fs.readFileSync(__dirname + "/jquery/jquery-1.8.1.min.js").toString(),
    highcharts = fs.readFileSync(__dirname + "/highcharts/highcharts.2.3.2.js").toString();
    exporting = fs.readFileSync(__dirname + "/highcharts/exporting.2.3.2.js").toString();

function createHighchartsWindow(callback) {
   try {

      jsdom.env({
         html: "<div id=\"container\"></div>", 
         src: [
            jquery, 
            highcharts,
            exporting
         ],
         done: function(err, window) {
            if(err) {
               console.error('Failed to create dom')
               callback(err, null)
               return
            } else {
               console.log('Created highcharts window')
               callback(null, window)
            }
         }
      })

   } catch(e) {

      callback(e, null)
   }
}

function serverifyOptions(options) {
   options.chart.renderTo = 'container';
   options.chart.renderer = 'SVG';
   options.chart.animation = false;
   options.chart.forExport = true;
   options.exporting = {
      enabled: false
   };
   options.series.forEach(function(series) {
      series.animation = false;
   });
}

function renderSvg(options, callback) {
   
   createHighchartsWindow(function(err, window) {
      if(err) {
         callback(err, null)
         return
      }

      try {

         console.log('Rendering SVG')

         serverifyOptions(options);
         
         try {
            chart = new window.Highcharts.Chart(options);
         } catch (e) {
            console.error('Failed to create Highcharts chart')
            callback(e, null);
            return;
         }

         var svg = chart.getSVG();

         callback(null, svg);

      } catch (err) {
         console.error('Failed to render SVG')
         callback(err, null);
      }
   });
}

function render(options, callback) {
   try {
      renderSvg(options, function(err, svg) {

         var convert, buffer;

         if(err) {
            callback(err, null);
            return;
         } 

         console.log("Rendering PNG")

         // Start convert
         convert  = spawn('convert', ['svg:-', 'png:-']);

         // Pump in the svg content
         convert.stdin.write(svg);
         convert.stdin.end();
         
         // Write the output of convert straight to the response
         convert.stdout.on('data', function(data) {
            try {
               var prevBufferLength = (buffer ? buffer.length : 0),
                   newBuffer = new Buffer(prevBufferLength + data.length);
                  
               if (buffer) {
                  buffer.copy(newBuffer, 0, 0);
               }
               
               data.copy(newBuffer, prevBufferLength, 0);
               
               buffer = newBuffer;

            } catch (err) {
               console.error('Failed to convert svg to png')
               callback(err, null);
            }
         });
         
         // When we're done, we're done
         convert.on('exit', function(code) {
            console.log('Finished rendering PNG')
            callback(null, buffer);
         });
      });
   } catch(err) {
      callback(err, null);
   }
}

exports.renderSvg = renderSvg;
exports.render = render;
