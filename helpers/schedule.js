var app_debug= process.env.APP_DEBUG || 'false';
const app_env= process.env.APP_ENV || 'local';
app_debug = app_debug == 'true'? true : false;

const fs= require('fs');
var moment = require('moment');
const appRoot = require('app-root-path');
const schedule = require('node-schedule');
const dotProp = require('dot-prop');
const _ = require('lodash');
const clog = require(appRoot+"/helpers/console_logger.js")({ debug: app_debug, use_datetime_prefix: true });

module.exports= function(options){
	var scheduler= {
		debug: options.debug || false,
		data: {
			objects: options.objects || {},
			mqtt_service: options.mqtt_service || {},
			schedules: [],
			object_type_marker_path: {},
			storage: options.storage || {}
		},
		init: function(){
			var self=this;
			self.data.object_type_marker_path=dotProp.get(self.data.storage, 'object_types.marker_path', {}); 
			self.setSchedules();
		},
		setSchedules: function(){
			var self=this;
			let offices= dotProp.get(self.data.objects, 'objects.offices', {});

			//# Check toilet availability
			let toilet_topic_format= dotProp.get(self.data.objects, 'schema.object_types.toilet.topics.get_data','');
			if(!_.isEqual(toilet_topic_format, '')){
				self.data.schedules.push(schedule.scheduleJob('*/2 * * * *', function(){
					_.each(offices, function(ov, ok){
						if(self.debug){
							clog.stdout('notice', '* Schedule (each-2-minutes) \\ Check MQTT Service (check toilet availability - '+ok+')');
						}
						let e_toilet_topic_format= toilet_topic_format.replace('{office_id}', ok);
						// ###
					  //# set a market as unknown status
					  let marker_path= self.data.object_type_marker_path.toilet.replace('{office_id}', ok);
					  let toilets= dotProp.get(self.data.objects, 'objects.toilets.'+ok+'', []);
					  let c_time = new Date();
					  _.each(toilets, function(object_type_id){
					  	let e_marker_path= marker_path.replace('{object_type_id}', object_type_id);
							// +'.mark';
					  	//# publish getData for each object-type
					  	let eot_toilet_topic_format= e_toilet_topic_format.replace('{toilet_id}', object_type_id);
					  	self.data.mqtt_service.client.publish(eot_toilet_topic_format, 'getData');
					  	if(self.debug){
								clog.stdout('notice', '--> Publish getData : '+eot_toilet_topic_format);
							}

					  	// touch marker file
							if(!fs.existsSync(appRoot+e_marker_path)){
								let mark_content={
									created_at: moment().format('YYYY-MM-DD hh:mm:ss.SSS'),
									office_id: ok,
									object_type_id: object_type_id,
									object_type: 'toilet',
									door_status: dotProp.get(self.data.objects, 'schema.object_types.toilet.topics.door_status', '').replace('{office_id}', ok).replace('{toilet_id}', object_type_id)
								};
								fs.writeFileSync(appRoot+e_marker_path, JSON.stringify(mark_content), {'encoding': 'utf-8', 'flag': 'w'});
							}
					  	if(self.debug){
								clog.stdout('notice', '---> set marker for toilet availability (unknown-state)  - '+ok+'-'+object_type_id+')');
							}
					  });
					});
				}));
			}

			//# Validate check-status marker and set offline
			self.data.schedules.push(schedule.scheduleJob('* * * * *', function(){
				var marker_dir= dotProp.get(self.data.storage, 'object_types.marker_path.base', '');
				if(self.debug){
					clog.stdout('info', '* Schedule (each-minutes) \\ Validate Marker Status', {
						'marker_dir': marker_dir
					});
				}
				if(marker_dir != ''){
					var marker_files = fs.readdirSync(appRoot+marker_dir);
					if(self.debug){
						// clog.stdout('notice', '--> Marker Files', {
						// 	'marker_files': marker_files
						// });
					}

					_.forEach(marker_files, function(file){
						let length=file.length;
					  let ext=file.slice((length - 5), length);
					  let segment=file.slice(0, (length - 5));
					  if(ext=='.mark'){
					  	let mark_content= JSON.parse(fs.readFileSync(appRoot+marker_dir+'/'+file, 'utf-8'));
					  	self.data.mqtt_service.client.publish(mark_content.door_status, '-1');
					  	if(self.debug){
								clog.stdout('notice', '--> '+mark_content.object_type+': '+mark_content.office_id+'-'+mark_content.object_type_id+' (set inactive | -1)');
							}
					  }
					});
				}
			}));
		}
	};

	scheduler.init();

	return scheduler;
}

