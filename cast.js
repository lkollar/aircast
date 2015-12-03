'use strict';

var logger = require('winston');
var castclient = require('castv2-client');
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;

/**
 * Chromecast sender.
 * @param address The Cast device's address
 * @param mediaUrl The URL to the media to play
 * @constructor
 */
function Sender(address, mediaUrl) {
    this.address = address;
    this.mediaUrl = mediaUrl;
    this.client = new castclient.Client();
}

Sender.prototype.cast = function () {
    var that = this;
    this.client.connect(this.address, function () {
        logger.info('Connected to Cast device, launching app...');
        that.client.launch(DefaultMediaReceiver, function (_, player) {
            var media = {
                contentId: that.mediaUrl,
                contentType: 'audio/wav',
                streamType: 'LIVE',

                // Title and cover displayed while buffering
                metadata: {
                    type: 0,
                    metadataType: 0,
                    title: "AirCast Stream"
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

    this.client.on('error', function (err) {
        logger.warn('Cast error: ', err);
        that.client.close();
    });
};

exports.Sender = Sender;
