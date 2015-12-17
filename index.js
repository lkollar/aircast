var os = require('os');
var http = require('http');

var logger = require('winston');
var AirTunesServer = require('nodetunes');
var BufferedStream = require('bufferedstream');
var wav = require('wav');
var mdns = require('mdns');
var Promise = require('bluebird');

var cast = require('./cast');
var net = require('./net.js');

var audioStream = new BufferedStream;

var optimist = require('optimist')
    .usage('Usage $0 [options]')
    .describe('h', 'Display help')
    .describe('i', 'Ip or hostname for the audio stream (default: first' +
        ' external interface)')
    .describe('p', 'Port for HTTP streaming server (default: allocate random' +
        ' port)')
    .alias('h', 'help')
    .alias('i', 'ip')
    .alias('p', 'port');

var argv = optimist.argv;
if (argv.help) {
    optimist.showHelp();
    process.exit(0);
}

var getMac = Promise.promisify(require("getmac").getMac);
var getIp = Promise.promisify(require('dns').lookup);

// The .default() method in optimist would print 0 as default which can be
// misleading, so let's not use it.
if (!argv.port) {
    argv.port = 0;
}

var streamServer = http.createServer(function (req, res) {
    logger.info('HTTP Client connected. Headers: ', req.headers);
    var writer = wav.Writer();
    res.writeHead(200, {
        'Content-Type': 'audio/wav'
    });

    audioStream.pipe(writer).pipe(res);
});

streamServer.on('error', function (e) {
    logger.info(e.code);
    switch (e.code) {
        case 'EACCES':
            logger.error('Invalid port');
            process.exit(-1);
            break;
        default:
            logger.error('HTTP streamServer error: ', e);
            process.exit(-1);
            break;
    }
});
var httpPort;
var localIpResolve;
if (argv.ip) {
    localIpResolve = Promise.resolve(argv.ip);
} else {
    localIpResolve = getIp(os.hostname());
}
streamServer.listen(argv.port);

streamServer.on('listening', function () {
    httpPort = streamServer.address().port;
    logger.info('HTTP server listening on port', httpPort);
});

var airCastServers = {};

// Fix for getaddrinfo issues with ipv6:
// https://github.com/agnat/node_mdns/issues/130
var sequence = [
    mdns.rst.DNSServiceResolve(),
    'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({families:[4]}),
    mdns.rst.makeAddressesUnique()
];
var browser = mdns.createBrowser(mdns.tcp('googlecast'), {resolverSequence: sequence});
browser.on('serviceUp', function (service) {
    logger.info('Found Cast device:', service.name);

    var castDevice = {
        name: service.name,
        address: service.addresses[0],
        port: service.port
    };

    if (castDevice.name in airCastServers) {
        return;
    }

    localIpResolve.then(function (ip) {
        var airCastServer;
        var streamAddress = 'http://' + ip + ':' + httpPort;
        logger.info('Starting stream at', streamAddress);
        getMac().then(function(mac) {
            airCastServer = new AircastServer(
                service.name,
                streamAddress,
                castDevice, mac);
            airCastServer.start();
            airCastServers[castDevice.name] = airCastServer;
        });
    });
});

browser.on('serviceDown', function (service) {
    var deviceName = service.name;
    logger.info('Cast device:', deviceName , 'is gone.');
    if (deviceName in airCastServers) {
        airCastServers[deviceName].stop();
        delete airCastServers[deviceName];
    }
});

browser.start();

var AircastServer = function (serverName, streamAddress, castDevice, mac) {
    this.streamAddress = streamAddress;
    this.castDevice = castDevice;
    this.serverName = serverName;
    this.server = new AirTunesServer({
        serverName: this.serverName,
        macAddress: mac
    });

    logger.info('Starting AirTunes server:', serverName);
    this.server.start();
};

AircastServer.prototype.start = function () {
    this.server.on('clientConnected', function (stream) {
        logger.info('AirPlay client connected, starting Chromecast receiver');
        logger.info('Stream available at', this.streamAddress);
        var sender = new cast.Sender(this.castDevice.address, this.streamAddress);
        sender.cast();
        stream.pipe(audioStream);
    }.bind(this));
};

AircastServer.prototype.stop = function () {
    logger.info('Stopping service for', this.serverName);
    this.server.stop();
}
