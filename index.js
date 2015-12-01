var logger = require('winston');
var AirTunesServer = require('nodetunes');
var http = require('http');
var BufferedStream = require('bufferedstream');
var wav = require('wav');
var cast = require('./cast');
var os = require('os');

var audioStream = new BufferedStream;
var serverName = 'AirCast Server';

http.createServer(function (req, res) {
    logger.info('HTTP Client connected. Headers: ', req.headers);
    var writer = wav.Writer();
    res.writeHead(200, {
        'Content-Type': 'audio/wav'
    });

    audioStream.pipe(writer).pipe(res);
}).listen(1337);


function getIp(hostName) {
    var result = null;
    var dns  = require('dns');
    dns.lookup(hostName, function (err, address) {
        if (err) {
            throw new Error('Unable to determine local IP address. Error:', err);
        }
        logger.info('Local IP: ', address);
        result = address;
    });
    return result;
}

var airplayServer = new AirTunesServer({
    serverName: serverName
});

airplayServer.on('clientConnected', function (stream) {
    var url = 'http://' + getIp(os.hostname()) + ':1337';
    logger.info('AirPlay client connected, starting Chromecast receiver');
    var sender = new cast.Sender(url);
    sender.start();
    stream.pipe(audioStream);
});

airplayServer.start();
logger.info('Started AirCast server [', serverName, ']');
