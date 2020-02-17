var app_debug= process.env.APP_DEBUG || 'false';
const app_env= process.env.APP_ENV || 'local';
app_debug = app_debug == 'true'? true : false;

const appRoot = require('app-root-path');
const dotProp = require('dot-prop');
const fs= require('fs');
const _ = require('lodash');
const objectConfig= require(appRoot+"/helpers/object_config.js");
const clog = require(appRoot+"/helpers/console_logger.js")({ debug: app_debug, use_datetime_prefix: true });

var mqtt_subscriber= {
	data: {},
	init: function(options){
		var self=this;	
		self.debug= options.debug || false;
		self.data={
			objects: options.objects || {},
			storage: options.storage || {},
			object_status_path: {} 
		}
		self.data.object_status_path= dotProp.get(this.data.storage, 'object_types.status_path', {});
		self.data.object_type_marker_path=dotProp.get(self.data.storage, 'object_types.marker_path', {})
	},
	processMessage: function(topic, message){
		var self=this;
		if(self.debug){
			clog.stdout('notice', '--> MQTT Process Message  \\ Message Received ('+topic+'): ', message.toString());
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

		//# update object type status
		let is_door_status= topic.match(/door-status/g);
		message= _.trim(message); 
		if(_.isArray(is_door_status) && _.includes(['0','1','-1'], message)){
			//# update object-type-status
			self.updateStatusFile(object_type, office_id, ot_id, message);
			//# remove marker checker
			self.removeCheckingMarkerFile(object_type, office_id, ot_id, message);
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
	},
	removeCheckingMarkerFile: function(object_type, office_id, ot_id, status){
		var self= this;
		let marker_path= self.data.object_type_marker_path[object_type].replace('{office_id}', office_id).replace('{object_type_id}', ot_id);
		if(self.debug){
			clog.stdout('notice', '--> Check Mark Path: '+marker_path);
		}
		if(fs.existsSync(appRoot+marker_path)){
			if(self.debug){
				clog.stdout('notice', '--> Removing: '+marker_path);
			}
			fs.unlinkSync(appRoot+marker_path);
		}
	}
};

module.exports= function(options){
	mqtt_subscriber.init(options);
	return mqtt_subscriber;
};
