var os = require('os');
var _ = require('lodash');

function getExternalInterfaces() {
    var ifaces = os.networkInterfaces();
    return _.pick(ifaces, function (iface) {
        return _.some(iface, function (ifaceDetail) {
            return (ifaceDetail.internal === false)
        });
    });
}

function getAddress(interfaces, interface, family) {
    if (!family) family = 'IPv4';
    if (!(interface in interfaces)) return null;

    var result = _.find(interfaces[interface], function(iface) {
        return iface.family === family;
    });

    if (!result) return null;

    return result.address;
}

module.exports.getExternalInterfaces = getExternalInterfaces;
module.exports.getAddress = getAddress;