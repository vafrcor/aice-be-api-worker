const fs= require('fs');
const appRoot = require('app-root-path');
const dotProp = require('dot-prop');

module.exports= {
	read: (fpath) => {
		let objectJSON = JSON.parse(fs.readFileSync(appRoot+fpath, 'utf-8'));
		return objectJSON;
	},
	write: (fpath, content) => {
		fs.writeFileSync(appRoot+fpath, JSON.stringify(content), {'encoding': 'utf-8', 'flag': 'w'});
	}
};
