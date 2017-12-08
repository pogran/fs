const express = require('express')
const router = express.Router()
const config = require('config')
const fs = require('fs')
const util = require('util')
const path = require('path')

const multer = require('multer');
const upload = multer({ dest: 'upload/'});

const onError = (error, res) => {
	res.json({
		success: false,
		error: error.toString()
	})
}

const onSuccess = (data, message, res) => {
	res.json({
		success: true,
		data,
		message: message.toString()
	})
}

router
	.get('/', function(req, res, next) {
		res.send(`\n1. GET /get | params - path 
			\n2. POST /create | params - folder , path 
			\n3. POST /upload | params - file, path 
			\n4. GET /download | params - file
			\n5. GET /view | params - file`
		)
	})
	.get('/get', (req, res) => {
		let pathway	= req.query.path
		if(!pathway) { 
			pathway = config.root
		}

		const readDirAsync = util.promisify(fs.readdir)
		readDirAsync(pathway)
			.then(files => {
				onSuccess(
					files.length ? files : [],
					files.length ? 'Folder not empty' : 'Folder empty',
					res
				)
			})
			.catch(error => {
				onError(error, res)
			})
	})
	.post('/create',upload.array(), (req, res) => {
		let pathway = req.body.path
		
		const folder = req.body.folder
		if(!pathway) {
			pathway = config.root
		}

		console.log('pathway', pathway);

		const exitsPathAsync = util.promisify(fs.exists)

		const exitPathPromise = new Promise((fulfill, reject) => {
			exitsPathAsync(pathway)
				.then(exits => {
					if(!exits) {
						reject(`Path ${pathway} don't find`)
					} else {
						fulfill()
					}
				})
				.catch(err => {
					reject(err)
				})
		})

		const exitFolderPromise = new Promise((fulfill, reject) => {
			if(!folder) {
				reject(`Param 'folder' required`)
			}

			exitsPathAsync(path.join(pathway, folder))
				.then(exits => {
					if(exits) {
						reject(`Folder '${folder}' already exists`) 
					} else {
						fulfill() 
					}
				})
		})

		Promise.all([exitPathPromise,exitFolderPromise])
			.then(() => {
				return new Promise((fulfill, reject) => {
					const mkdirAsync = util.promisify(fs.mkdir)
					mkdirAsync(path.join(pathway, folder))
						.then(() => {
							res.json({
								success: true,
								message: `Folder '${folder}' successful create`
							})
						})
						.catch(err => {
							reject(err)
						})
				})
			})
			.catch(err => {
				onError(err, res)
			})
	})
	.post('/upload',upload.single('file'), (req, res) => {
		let pathway = req.body.path
		if(!pathway) {
			pathway = config.root
		}

		const validatePromise = new Promise((fulfill, reject) => {
			if(!req.file) {
				reject('Params "file" required and should be a file')
			} else {
				fulfill()
			}
		})

		const uploadFile = () => {
			const tmpStream = fs.createReadStream(req.file.path);
			const endStream = fs.createWriteStream(path.join(pathway, req.file.originalname));
	
			endStream.on('error', error => onError(error, res))
			tmpStream.on('error', error => onError(error, res))
	
			tmpStream.pipe(endStream)
			tmpStream.on('end', () => {
				res.json({
					success: true,
					message: 'File successful create'
				})
			});
		}

		validatePromise
			.then(() => uploadFile())
			.catch(error => onError(error, res))
	})
	.get('/download', (req, res) => {
		const file = req.query.file

		const validatePromise = new Promise((fulfill, reject) => {
			if(!file) {
				reject('Param "File" is required')
			}
			fulfill()
		})

		const downloadPromise = new Promise((fulfill, reject) => {
			res.download(file, error => {
				if(error) {
					reject(error)
				} 
			})
		})

		validatePromise
			.then(() => downloadPromise)
			.catch(error => onError(error, res))
	})
	.get('/view', (req, res) => {
		const file = req.query.file

		const validatePromise = new Promise((fulfill, reject) => {
			if(!file) {
				reject('Param "File" is required')
			}
			fulfill()
		})

		validatePromise
			.then(() => {
				const fileStream = fs.ReadStream(file)
				
				fileStream.on('error', error => onError(error, res))
				fileStream.pipe(res) 
			}) 
			.catch(error => onError(error, res))
	})
	// .post('/create',(req, res) => {
	// 	let pathway = req.body.path
	// 	const folder = req.body.folder
	// 	if(!pathway) {
	// 		pathway = config.root
	// 	}

	// 	const exitsAsync = util.promisify(fs.exists)
	// 	exitsAsync(pathway)
	// 		.then(exits => {
	// 			if(!exits) {
	// 				return Promise.reject(`Path ${pathway} don't find`)
	// 			} else {
	// 				return Promise.resolve()
	// 			}
	// 		})
	// 		.then(() => {
	// 			return new Promise((fulfill, reject) => {
	// 				const checkFolder = util.promisify(fs.exists)
	// 				checkFolder(path.join(pathway,folder))
	// 				.then(exits => {
	// 					console.log('ex', exits)
	// 					if(exits) {
	// 						return reject(`Folder ${folder} already find`)
	// 					} else {
	// 						return fulfill()
	// 					}
	// 				})
	// 				.catch(err => {
	// 						return reject(err)
	// 				})
	// 			})
	// 		})
	// 		.then(() => {
	// 			return new Promise((fulfill, reject) => {
	// 				const mkdirAsync = util.promisify(fs.mkdir)
	// 				mkdirAsync(path.join(pathway, folder))
	// 					.then(() => {
	// 						res.json({
	// 							success: true,
	// 							message: `Folder ${folder} successful create`
	// 						})
	// 					})
	// 					.catch(err => {
	// 						reject(err)
	// 					})
	// 			})
	// 		})
	// 		.catch((err) => {
	// 			console.log('err', err)
	// 			res.json({
	// 				success: false,
	// 				error: err.toString()
	// 			})
	// 		})
	// })
	


module.exports = router;
