/* global define, it, describe */

const chai = require('chai')
const app = require('../app')
const config = require('config')
const fs = require('fs')
const path = require('path')

const expect = chai.expect
const supertest = require('supertest')
const request = supertest('localhost:3000/fs')

let should = chai.should()

const deleteFolder = (path) => {
	fs.rmdir(path, err => {
		if(err) {
			console.error('delete folder', err)
		}
	})
}

describe.only('Fs', () => {
	describe('GET /fs/', () => {
		it('response status = 200', done => {
			request
				.get('/')
				.expect('Content-Type', /text/)
				.expect(200, done)
		})

		it('response a string', done => {
			request
				.get('/')
				.then(res => {
					res.text.should.be.a('string')
					done()
				})
				.catch(err => done(err))
		})
	})

	describe('GET /fs/get', () => {
		it('response status = 200', done => {
			request
				.get('/get')
				.expect('Content-Type', /json/)
				.expect(200, done)
		})

		it('if empty folder', done => {
			request
				.get('/get')
				.query({path: `${config.root}/empty`})
				.then(res => {
					const result = JSON.parse(res.text)
					expect(result.success).to.eql(true)
					expect(result.data).to.be.an('array').that.lengthOf(0)
					expect(result.message).to.be.eql('Folder empty')
					done()
				})
				.catch(err => done(err))
		})

		it('without param: path', done => {
			request
				.get('/get')
				.then(res => {
					const result = JSON.parse(res.text)
					expect(result.success).to.eql(true)
					expect(result.data).to.be.an('array')
					expect(result.message).to.be.eql('Folder not empty')
					done()
				})
				.catch(err => done(err))
		})

		it('with param: path', done => {
			request
				.get('/get')
				.query({path: `${config.root}/folders`})
				.then(res => {
					const result = JSON.parse(res.text)
					expect(result.success).to.eql(true)
					expect(result.data).to.be.an('array').that.lengthOf(1)
					expect(result.message).to.be.eql('Folder not empty')
					done()
				})
				.catch(err => done(err))
		})

		it('invalid path', done => {
			request
				.get('/get')
				.query({path: `${config.root}/test`})
				.then(res => {
					const result = JSON.parse(res.text)
					expect(result.success).to.eql(false)
					expect(result).to.have.property('error')
					done()
				})
				.catch(err => done(err))
		})
	})

	describe('POST /fs/create', () => {
		it('response status = 200' , done => {
			request
				.post('/create')
				.expect('Content-Type', /json/)
				.expect(200, done)
		})

		it('without params: folder,path' , done => {
			request
				.post('/create')
				.then(res => {
					const result = JSON.parse(res.text)
					expect(result.success).to.eql(false)
					expect(result.error).to.eql("Param 'folder' required")
					done()
				})
				.catch(err => done(err))
		})

		it('without params: path' , done => {
			const folderName = 'create'

			request
				.post('/create')
				.send({folder: folderName, path: ''})
				.then(res => {
					const result = JSON.parse(res.text)
					expect(result.success).to.eql(true)

					if(result.success) {
						deleteFolder(path.join(config.root, folderName))
					}
					done()
				})
				.catch(err => done(err))
		})

		it('with params: path, folder' , done => {
			const folderName = 'create'
			const pathWay = `${config.root}/exists/`

			request
				.post('/create')
				.send({folder: folderName, path: pathWay})
				.then(res => {
					const result = JSON.parse(res.text)
					expect(result.success).to.eql(true)
					expect(result.message).to.eql("Folder 'create' successful create")

					if(result.success) {
						deleteFolder(path.join(pathWay, folderName))
					}
					done()
				})
				.catch(err => done(err))
		})

		it('if exists folder', done => {
			const folderName = 'exists'

			request
				.post('/create')
				.send({folder: folderName, path: ''})
				.then(res => {
					const result = JSON.parse(res.text)
					expect(result.success).to.eql(false)
					expect(result.error).to.eql("Folder 'exists' already exists")
					done()
				})
				.catch(err => done(err))
		})
	})

	describe('POST /fs/upload', () => {
		it('response status = 200', done => {
			request
				.post('/upload')
				.expect(200, done)
		});

		it('invalid param file', done => {
			request
				.post('/upload')
				.send({file: 'test'})
				.then(res => {
					const result = JSON.parse(res.text)
					expect(result.success).to.eql(false)
					expect(result).to.have.property('error')
					expect(result.error).to.eql('Params "file" required and should be a file')
					done()
				})
				.catch(err => done(err))
		})

		it('empty param file', done => {
			request
				.post('/upload')
				.then(res => {
					const result = JSON.parse(res.text)
					expect(result.success).to.eql(false)
					expect(result).to.have.property('error')
					expect(result.error).to.eql('Params "file" required and should be a file')
					done()
				})
				.catch(err => done(err))
		})

		it('empty param path', done => {
			let file = `${config.testDataFolder}/test.txt`

			request
				.post('/upload')
				.attach('file', file)
				.then(res => {
					const result = JSON.parse(res.text)
					expect(result.success).to.eql(true)
					expect(result.message).to.eql('File successful create')
					done()
				})
				.catch(err => done(err))
		})

		it('invalid param path', done => {
			let file = `${config.testDataFolder}/test.txt`

			request
				.post('/upload')
				.attach('file', file)
				.field('path', `${config.root}/invalid`)
				.then(res => {
					const result = JSON.parse(res.text)
					expect(result.success).to.eql(false)
					expect(result).to.have.property('error')
					done()
				})
				.catch(err => done(err))
		})
	})
})
