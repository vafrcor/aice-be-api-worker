const fs= require('fs');
const appRoot = require('app-root-path');

module.exports= {
	read: (fpath) => {
		let objectJSON = JSON.parse(fs.readFileSync(appRoot+fpath, 'utf-8'));
		return objectJSON;
	}
}