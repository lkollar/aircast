var assert = require('assert');
var sinon = require('sinon');
var cast = require('../cast');
var mockery = require('mockery');

describe('Sender', function () {
    var clientStub;
    before(function() {
        clientStub = sinon.stub();
        mockery.registerMock('castv2-client', clientStub); // FIXME
    });

    it('should set the ctor args correctly', function () {
        var address = '10.0.0.1:8081';
        var mediaUrl = 'http://localhost:5000';
        var sender = new cast.Sender(address, mediaUrl);
        assert.equal(sender.address, address);
        assert.equal(sender.mediaUrl, mediaUrl);
    });

    after(function() {
       mockery.disable();
    });
});