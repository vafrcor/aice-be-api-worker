const fs= require('fs');
const appRoot = require('app-root-path');
const schedule = require('node-schedule');
const dotProp = require('dot-prop');
const _ = require('lodash');

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
				_.each(offices, function(ov, ok){
					var e_toilet_topic_format= toilet_topic_format.replace('{office_id}',ok);
					self.data.schedules.push(schedule.scheduleJob('* * * * *', function(){
						if(self.debug){
							console.log('* Schedule (each-minutes) \\ Check MQTT Service (check toilet availability - '+ok+')');
						}

						//# publish getData for each object-type
					  self.data.mqtt_service.client.publish(e_toilet_topic_format, 'getData');

					  //# set a market as unknown status
					  let marker_path= self.data.object_type_marker_path.toilet.replace('{office_id}', ok);
					  let toilets= dotProp.get(self.data.objects, 'objects.toilets.'+ok+'', []);
					  let c_time = new Date();
					  _.each(toilets, function(object_type_id){
					  	let e_marker_path= marker_path.replace('{object_type_id}', object_type_id);
					  	
					  	// touch marker file
					  	// 	try {
							//   fs.utimesSync(e_marker_path, c_time, c_time);
							// } catch (err) {
							//   fs.closeSync(fs.openSync(e_marker_path, 'w'));
							// }

							if(!fs.existsSync(appRoot+e_marker_path)){
								fs.writeFileSync(appRoot+e_marker_path, '', {'encoding': 'utf-8', 'flag': 'w'});
							}
					  	if(self.debug){
								console.log('--> set marker for toilet availability (unknown-state)  - '+ok+'-'+object_type_id+')');
							}
					  });
					}));
				});
			}

			//# Validate check-status marker and set offline

		}
	};

	scheduler.init();

	return scheduler;
}

