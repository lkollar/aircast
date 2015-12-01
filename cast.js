var logger = require('winston');
var Client = require('castv2-client').Client;
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
var mdns = require('mdns');

function Sender(mediaUrl) {
    this.mediaUrl_ = mediaUrl;
    this.browser_ = mdns.createBrowser(mdns.tcp('googlecast'));
    this.browser_.on('serviceUp', function (service) {
        logger.log(
            'info',
            'Found Chromecast device "%s" at %s:%d',
            service.name,
            service.addresses[0],
            service.port);

        deviceUp(service.addresses[0], this.mediaUrl_);
    });
}

function deviceUp(host, mediaUrl) {

    var client = new Client();

    client.connect(host, function () {

        logger.info('Connected to Chromecast device, launching app...');
        client.launch(DefaultMediaReceiver, function (err, player) {
            var media = {
                contentId: mediaUrl,
                contentType: 'audio/wav',
                streamType: 'LIVE',

                // Title and cover displayed while buffering
                metadata: {
                    type: 0,
                    metadataType: 0,
                    title: "AirCast Stream",
                    //images: [
                    //    {url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'}
                    //]
                }
            };
            logger.info('Opening media: ', media);

            player.on('status', function (status) {
                logger.log('debug', 'Sender status:', status);
            });

            player.load(media, {autoplay: true}, function (err, status) {
                logger.log('info', 'Media loaded - status:', status);
            });

        });

    });

    client.on('error', function (err) {
        logger.warn('Error: ', err);
        client.close();
    });
}

Sender.prototype.start = function () {
    this.browser_.start();
};

exports.Sender = Sender;