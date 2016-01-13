describe('c1_security_pubpriv_login', function() {

  var expect = require('expect.js');
  var happn = require('../lib/index');
  var service = happn.service;
  var happn_client = happn.client;
  var async = require('async');

  var happnInstance = null;
  var encryptedPayloadInstance = null;

  var test_id = Date.now() + '_' + require('shortid').generate();

  var http = require('http');

  var adminClient;
  var testClient;

  var bitcore = require('bitcore-lib');
  var ECIES = require('bitcore-ecies');

  /*
  This test demonstrates starting up the happn service - 
  the authentication service will use authTokenSecret to encrypt web tokens identifying
  the logon session. The utils setting will set the system to log non priority information
  */

  before('should initialize the service', function(callback) {
    
    this.timeout(20000);


    try{
      service.create({
          secure:true
        },function (e, happnInst) {
        if (e)
          return callback(e);

        happnInstance = happnInst;

        service.create({
            secure:true,
            encryptPayloads:true
          },function (e, happnInst) {
          if (e)
            return callback(e);

          encryptedPayloadInstance = happnInst;
          callback();

        });

      });
    }catch(e){
      callback(e);
    }
  });

  after(function(done) {

    adminClient.disconnect()
    .then(testClient.disconnect()
    .then(happnInstance.stop()
    .then(encryptedPayloadInstance.stop()
    .then(done))))
    .catch(done);


  });


  it('logs in with the test client, without supplying a public key - attempts to encrypt a payload and fails', function (callback) {

    happn.client.create({
        config:{username:'_ADMIN', password:'happn'},
        secure:true
      })

      .then(function(clientInstance){
        adminClient = clientInstance;
        adminClient.set('/an/encrypted/payload/target', {"encrypted":"test"}, {encryptPayload:true}, function(e, response){

          expect(e.toString()).to.equal('Error:missing session secret for encrypted payload, did you set the publicKey config option when creating the client?');
          callback();
          
        });
      })

      .catch(function(e){
        callback(e);
      });
    });

  });

  it('logs in with the test client, supplying a public key - receives a sessionSecret and encrypts a payload using the option', function (callback) {

    happn.client.create({
        config:{username:'_ADMIN', password:'happn'},
        secure:true,
        publicKey:keyPair.publicKey.toString()
      })

      .then(function(clientInstance){

        adminClient = clientInstance;

         adminClient.set('/an/encrypted/payload/target', {"encrypted":"test"}, {encryptPayload:true}, function(e, response){

          expect(e).to.equal(null);
          callback();

        });

      })

      .catch(function(e){
        callback(e);
      });
    });


  });

  
  it('fails to log in with the test client, without supplying a public key to the default encryptPayload server', function (callback) {

    happn.client.create({
        config:{
          username:testUser.username, 
          password:'TEST PWD',
          port:10000
        },
        secure:true
      })

      .then(function(clientInstance){
        callback(new Error('this wasnt meant to happen'));
      })

      .catch(function(e){
        expect(e.toString()).to.equal('Error: no public key supplied for encrypted payloads');
        callback();
      });

  });

});