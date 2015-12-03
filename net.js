var Promise = require('bluebird');
var dns  = require('dns');
var logger = require('winston');

function getIp(hostName) {
    return new Promise(function(fulfill, reject) {
        dns.lookup(hostName, function (err, address) {
            if (err) {
                reject('Unable to determine local IP address. Error:', err);
            }
            logger.info('Local IP:', address);
            fulfill(address);
        });
    });
}

module.exports.getIp = getIp;