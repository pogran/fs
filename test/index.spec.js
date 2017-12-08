/* global define, it, describe */

const chai = require('chai')
const app = require('../app')
const expect = chai.expect
const supertest = require('supertest')
const request = supertest('localhost:3000')


describe('App', function() {
  describe('GET /', function() {
    it('responds with status 200', function(done) {
			request
        .get('/')
				.expect(200, done)
    });
	});
})