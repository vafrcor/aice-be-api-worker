const appRoot = require('app-root-path');
const dotProp = require('dot-prop');
const fs= require('fs');
const _ = require('lodash');
const objectConfig= require(appRoot+"/helpers/object_config.js");

var mqtt_subscriber= {
	data: {},
	init: function(options){
		var self=this;	
		this.debug= options.debug || false;
		this.data={
			objects: options.objects || {},
			object_status_path: {
				toilet: '/storage/app/status/toilet.json',
				meeting_room: '/storage/app/status/meeting-room.json',
				parking_lot: '/storage/app/status/parking-lot.json'
			}
		}
	},
	processMessage: function(topic, message){
		var self=this;
		if(self.debug){
			console.log('--> MQTT Process Message  \\ Message Received ('+topic+'): ', message.toString());
		}
		let topic_split= topic.split('/');
		let office_id=topic_split[dotProp.get(self.data.object,'schema.object_types.meta.index.office_id', 0)];
		let ot_id=topic_split[dotProp.get(self.data.object,'schema.object_types.meta.index.office_id', 1)];

		let topic_is_toilet= topic.match(/toilet/g);
		let topic_is_meeting_room= topic.match(/meeting-room/g);
		let topic_is_parking_lot= topic.match(/parking-lot/g);
		let object_type= null;

		if(_.isArray(topic_is_toilet)){
			object_type= 'toilet';
		}
		else if(_.isArray(topic_is_meeting_room)){
			object_type= 'meeting_room';
		}
		else if(_.isArray(topic_is_parking_lot)){
			object_type= 'parking_lot';
		}

		let is_door_status= topic.match(/door-status/g);
		message= _.trim(message); 
		if(_.isArray(is_door_status) && _.includes(['0','1'], message)){
			self.updateStatusFile(object_type, office_id, ot_id, message);
		}
	},
	updateStatusFile: function(object_type, office_id, ot_id, status){
		var self= this;
		let fpath= self.data.object_status_path[object_type];
		let data= {};
		if(fs.existsSync(appRoot+fpath)){
			data= objectConfig.read(fpath);
		}
		if(_.isUndefined(data[office_id])){
			data[office_id]={};
		}
		data[office_id][ot_id]=parseInt(status);
		objectConfig.write(fpath, data);
	}
};

module.exports= function(options){
	mqtt_subscriber.init(options);
	return mqtt_subscriber;
};