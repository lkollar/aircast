var AirTunesServer = require('nodetunes');
var http = require('http');
var BufferedStream = require('bufferedstream');
var wav = require('wav');
var cast = require('./cast');

var audioStream = new BufferedStream;

var server = http.createServer(function (req, res) {
    console.log('HTTP Client connected');
    var writer = wav.Writer();
    res.writeHead(200, {
        'Content-Type': 'audio/wav'
    });

    audioStream.pipe(writer).pipe(res);
});


server.listen(1337);

var myIp = '10.0.1.48';
//var myIp = require('dns').lookup(require('os').hostname(), function (_, add) {
//    console.log('Local IP: ' + add);
//    return add;
//}).hostname;

var airplayServer = new AirTunesServer({
    serverName: 'AirCast Server'
});

airplayServer.on('clientConnected', function (stream) {
    console.log('Client connected');
    var sender = new cast.Sender('http://' + myIp + ':1337');
    sender.start();
    stream.pipe(audioStream);
});

airplayServer.start();
