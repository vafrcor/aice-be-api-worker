const chalk = require('chalk');
const log = console.log;
var moment = require('moment');

module.exports= function(options){
	var clog= {
		debug: false,
		data: { 
			use_datetime_prefix: false
		},
		init: function(options){
			this.debug= options.debug || false;
			this.data.use_datetime_prefix= options.use_datetime_prefix || false;
		},
		stdout: function(mtype, text, mdata){
			var self= this;
			let data= mdata || null;
			let type= mtype.toLowerCase() || 'default';
			let dtime= self.data.use_datetime_prefix == true? '['+type.toUpperCase()+':'+moment().format('YYYY-MM-DD hh:mm:ss.SSS')+'] ' : '';
			let message='';
			switch (type){
				case 'error':
					message= dtime+chalk.red(text);
					break;
				case 'info':
					message= dtime+chalk.green(text);
					break;
				case 'warning':
					message= dtime+chalk.yellow(text);
					break;
				case 'debug':
					message= dtime+chalk.magenta(text);
					break;
				case 'notice':
					message= dtime+chalk.white(text);
					break;
				default:
					message= dtime+chalk.gray(text);
					break; 
			}

			if(data == null){
				log(message);
			}else{
				log(message, data);
			}
		}
	};

	clog.init(options);

	return clog;
}
