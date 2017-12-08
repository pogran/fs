import fs from 'fs'

export function createReadStreamPromise(filePath) {
	return new Promise((fulfill, reject) => {
		const onError = error => {
			reject(error)
		}
		
		const stream = fs.createReadStream(filePath)

		stream.on('error', onError);
    stream.on('readable', function(){
			stream.close()
			fulfill(stream);
    });
	})
}