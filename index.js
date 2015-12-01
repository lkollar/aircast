var logger = require('winston');
var AirTunesServer = require('nodetunes');
var http = require('http');
var BufferedStream = require('bufferedstream');
var wav = require('wav');
var cast = require('./cast');

var audioStream = new BufferedStream;

var server = http.createServer(function (req, res) {
    logger.info('HTTP Client connected. Headers: ', req.headers);
    var writer = wav.Writer();
    res.writeHead(200, {
        'Content-Type': 'audio/wav'
    });

    audioStream.pipe(writer).pipe(res);
}).listen(1337);


var myIp = '10.0.1.48';
//var myIp = require('dns').lookup(require('os').hostname(), function (_, add) {
//    logger.info('Local IP: ', add);
//    return add;
//}).hostname;

var airplayServer = new AirTunesServer({
    serverName: 'AirCast Server'
});

airplayServer.on('clientConnected', function (stream) {
    logger.info('AirPlay client connected, starting Chromecast receiver...');
    var sender = new cast.Sender('http://' + myIp + ':1337');
    sender.start();
    stream.pipe(audioStream);
});

airplayServer.start();
