var logger = require('winston');
var AirTunesServer = require('nodetunes');
var http = require('http');
var BufferedStream = require('bufferedstream');
var wav = require('wav');
var cast = require('./cast');
var os = require('os');
var audioStream = new BufferedStream;

var serverName = 'AirCast Server';

var optimist = require('optimist')
    .usage('Usage $0 [options]')
    .describe('h', 'Display this help')
    .describe('p', 'Port for HTTP server')
    .alias('h', 'help')
    .alias('p', 'port')
    .default('port', 0);

var argv = optimist.argv;
if (argv.help) {
    optimist.showHelp();
    process.exit(0);
}

var server = http.createServer(function (req, res) {
    logger.info('HTTP Client connected. Headers: ', req.headers);
    var writer = wav.Writer();
    res.writeHead(200, {
        'Content-Type': 'audio/wav'
    });

    audioStream.pipe(writer).pipe(res);
});

server.on('error', function(e) {
    logger.info(e.code);
    switch (e.code) {
        case 'EACCES':
            logger.error('Invalid port');
            process.exit(-1);
            break;
        default:
            logger.error('HTTP server error: ', e);
            process.exit(-1);
            break;
    }
});

var http_port;
server.listen(argv.port);
server.on('listening', function() {
    http_port = server.address().port;
    logger.info('HTTP server listening on port', http_port);
});


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
