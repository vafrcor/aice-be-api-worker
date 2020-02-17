const mqtt = require('mqtt');
const dotProp = require('dot-prop');
var app_debug= process.env.APP_DEBUG || 'false';
const app_env= process.env.APP_ENV || 'local';
app_debug = app_debug == 'true'? true : false;
const appRoot = require('app-root-path');
const _ = require('lodash');
const clog = require(appRoot+"/helpers/console_logger.js")({ debug: app_debug, use_datetime_prefix: true });

var mqtt_client= null;
var mqtt_service_data= {};
var mqtt_service_debug= false;
var mqtt_service_subscriber= null;

var mqtt_service= {
	debug: true,
	options: {},
	init: function(options){
		var self= this;
		//console.log('MQTT Service \\ Options: '+JSON.stringify(options));
		mqtt_service_data= options;
		mqtt_service_debug= options.debug || false; 
		//console.log('MQTT Service \\ Debug : ', mqtt_service_debug);
		mqtt_service_subscriber= options.event_subscriber || null;
		let connect_url= 'ws://'+options.connection.host+':'+options.connection.port+''+options.connection.uri_segment_prefix;
		if(mqtt_service_debug){
			clog.stdout('info', '* MQTT \\ URL: '+connect_url);
		}
		
		mqtt_client = mqtt.connect(connect_url, {
			keepalive: 0,
			clean: true,
			reconnectPeriod: 1000
		});
	},
	setEvents: function() {
		var self= this;
		mqtt_client.on('message', self.eventOnMessage);
		mqtt_client.on('offline', self.eventOnOffline);
		mqtt_client.on('disconnect', self.eventOnDisconnect);
		mqtt_client.on('error', self.eventOnError);
		mqtt_client.on('connect', self.eventOnConnect);
	},
	eventOnMessage: function(topic, message){
		// var self= this;
		if(mqtt_service_debug){
			clog.stdout('info', '* MQTT \\ Message Received ('+topic+'): ', message.toString());
		}
		mqtt_service_subscriber.processMessage(topic, message);
	},
	eventOnOffline: function(){
		var self= this;
		if(mqtt_service_debug){
			clog.stdout('debug', '* MQTT \\ Offline');
		}
	},
	eventOnDisconnect: function(packet){
		var self= this;
		if(mqtt_service_debug){
			clog.stdout('warning', '* MQTT \\ Disconnect');
		}
	},
	eventOnError: function(err){
		var self= this;
		if(mqtt_service_debug){
			clog.stdout('error', '* MQTT \\ Error Occured', err);
		}
	},
	eventOnConnect: function(){
		// var self= this;
		// console.log("MQTT \\ Check", mqtt_service_debug);
		if(mqtt_service_debug){
			clog.stdout('debug', '* MQTT \\ Connected');
		}
		// console.log('abc', this);

		let offices= dotProp.get(mqtt_service_data.objects, 'objects.offices', []);

		_.each(offices, function(ov, ok){
			//# Listen toilets
			let toilets= dotProp.get(mqtt_service_data.objects, 'objects.toilets.'+ok+'', []);
			_.each(toilets, function(tltv,tltk){
				let t_topic_door_status= dotProp.get(mqtt_service_data.objects, 'schema.object_types.toilet.topics.door_status', '');
				if(!_.isEqual(t_topic_door_status, '')){
					t_topic_door_status= t_topic_door_status.replace('{office_id}', ok);
					t_topic_door_status= t_topic_door_status.replace('{toilet_id}', tltv);
					if(mqtt_service_debug){
						clog.stdout('notice', '--> MQTT \\ Subscribe: '+t_topic_door_status);
					}
					mqtt_client.subscribe(t_topic_door_status, (err) => {
						if(err){
					  		clog.stdout('error', '!! MQTT \\ Subscribe \\ Error: ', err);
						}
					});
				}
			});
		});

		// mqtt_client.subscribe('lb/toilet-tengah/door-status', (err) => {
		// 	if(err){
		//   		console.log('MQTT \\ Subscribe \\ something wrong: ', err);
		// 	}
		// });

		// mqtt_client.publish('lb/toilet-kamar/door-status', 'Current time is: ' + new Date());
	}
};

module.exports= function(options){
	mqtt_service.init(options);
	mqtt_service.setEvents();
	mqtt_service.client=mqtt_client;
	return mqtt_service;
};
