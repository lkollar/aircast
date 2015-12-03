var net = require('../net.js');
var assert = require('assert');
var mockery = require('mockery');
var sinon = require('sinon');

describe('getIp', function () {
    var dnsStub;
    before(function () {
        dnsStub = sinon.stub();
        mockery.registerMock('dns', dnsStub);
    });

    it('should return a valid IP', function () {
        dnsStub.callsArgWith(0, null, '127.0.0.1');
        net.getIp('localhost').then(function (result) {
            assert.equal(result, '127.0.0.1');
        });
    });

    it('should handle error correctly', function () {
        dnsStub.callsArgWith(0, 'error');
        net.getIp('localhost').catch(function (error) {
            assert.equal(error, 'error');
        });
    });

    after(function() {
       mockery.disable();
    });
});