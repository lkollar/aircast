var Client = require('castv2-client').Client;
var DefaultMediaReceiver  = require('castv2-client').DefaultMediaReceiver;
var mdns = require('mdns');

function Sender(mediaUrl) {
    this.mediaUrl_ = mediaUrl;
    this.browser_ = mdns.createBrowser(mdns.tcp('googlecast'));
    this.browser_.on('serviceUp', function(service) {
        console.log('found device "%s" at %s:%d', service.name, service.addresses[0], service.port);
        deviceUp(service.addresses[0], mediaUrl);
        //this.browser_.stop();
    });

    function deviceUp(host, mediaUrl) {

        var client = new Client();

        client.connect(host, function () {

            console.log('connected, launching app ...');
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
                console.log('Playing media: ' + JSON.stringify(media));
                player.on('status', function (status) {
                    //console.log('status broadcast playerState=%s', JSON.stringify(status));
                    console.log('player status');
                });

                //console.log('app "%s" launched, loading media %s ...', player.session.displayName, media.contentId);
                console.log('app launched');

                player.load(media, {autoplay: true}, function (err, status) {
                    //console.log('media loaded playerState=%s', status.playerState);
                    console.log('media loaded');

                    // Seek to 2 minutes after 15 seconds playing.
                    //setTimeout(function () {
                    //    player.seek(2 * 60, function (err, status) {
                    //        //
                    //    });
                    //}, 15000);

                });

            });

        });

        client.on('error', function(err) {
            console.log('Error: %s', err.message);
            client.close();
        });
    }
}

Sender.prototype.start = function() {
    this.browser_.start();
};

exports.Sender = Sender;