var tilelive = require("tilelive");
require("tilelive-http")(tilelive);
require("mbtiles").registerProtocols(tilelive);
var os = require('os');

var template = "http://tile.stamen.com/watercolor/{z}/{x}/{y}.jpg";
var output = "mbtiles://./watercolor-la.mbtiles";

var cpus = os.cpus().length;
process.env.UV_THREADPOOL_SIZE = cpus;
tilelive.stream.setConcurrency(16 * cpus);

var metadata = {
  type: "scanline",
  minzoom: 1,
  maxzoom: 2,
  bbox: [-118.9448, 32.8007, -117.6462, 34.8233]
};

tilelive.load(template,function(err,source) {

    if (err) throw err;

    var get = tilelive.createReadStream(source, metadata);

    tilelive.load(output,function(err,sink) {

        if (err) throw err;

        var put = tilelive.createWriteStream(sink);

        get.on('error', function(err) {
            console.log(err);
        });
        put.on('error', function(err) {
            throw err;
        });
        put.on('stop', function() {
            console.log('done downloading!');
            sink.startWriting(function() {
                sink._db.exec('delete from metadata;', function() {
                    sink.putInfo(metadata, function() {
                        sink.stopWriting(function() {
                            console.log('done writing!');
                        });
                    });
                });
            });
        });
        get.pipe(put);

    });
})
