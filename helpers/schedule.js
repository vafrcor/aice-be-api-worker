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
			schedules: []
		},
		init: function(){
			var self=this;
			this.setSchedules();
		},
		setSchedules: function(){
			var self=this;
			let offices= dotProp.get(self.data.objects, 'objects.offices', []);

			//# Check toilet availability
			let topic_format= dotProp.get(self.data.objects, 'schema.object_types.toilet.topics.get_data','');
			if(!_.isEqual(topic_format, '')){
				_.each(offices, function(ov, ok){
					var e_topic_format= topic_format.replace('{office_id}',ok);
					self.data.schedules.push(schedule.scheduleJob('* * * * *', function(){
						if(self.debug){
							console.log('Schedule (each-minutes) \\ Check MQTT Service (check toilet availability - '+ok+')');
						}
					  self.data.mqtt_service.client.publish(e_topic_format, 'getData');
					}));
				});
			}
		}
	};

	scheduler.init();

	return scheduler;
}

