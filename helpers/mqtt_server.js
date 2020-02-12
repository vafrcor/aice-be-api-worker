
const mqtt = require('mqtt');
var mqtt_client= null;

var mqtt_service= {
	// client: null,
	debug: true,
	options: {},
	init: function(options){
		var self= this;
		self.options= options;
		self.debug= options.debug || false; 
		let connect_url= 'ws://'+options.connection.host+':'+options.connection.port+''+options.connection.uri_segment_prefix;
		if(self.debug){
			console.log('MQTT \\ URL: '+connect_url);
		}
		
		mqtt_client = mqtt.connect(connect_url);
	},
	setEvents: function() {
		var self= this;
		mqtt_client.on('message', self.eventOnMessage);
		mqtt_client.on('offline', self.eventOnOffline);
		mqtt_client.on('disconnect', self.eventOnDisconnect);
		mqtt_client.on('error', self.eventOnError);
		mqtt_client.on('connect', self.eventOnConnect);
	},
	eventOnMessage: (topic, message) => {
		var self= this;
		console.log('MQTT \\ Message ('+topic+'): ', message.toString());
	},
	eventOnOffline: () => {
		var self= this;
		console.log("MQTT \\ Offline");
	},
	eventOnDisconnect: (packet) => {
		var self= this;
		console.log("MQTT \\ Disconnect");
	},
	eventOnError: () => {
		var self= this;
		console.log("MQTT \\ Error Occured");
	},
	eventOnConnect: function(self){
		var self= this;
		console.log("MQTT \\ Connected");
		// console.log('abc', this);

		mqtt_client.subscribe('lb/toilet-kamar/door-status', (err) => {
			if(err){
		  		console.log('MQTT \\ Subscribe \\ something wrong: ', err);
			}
		});

		mqtt_client.publish('lb/toilet-kamar/door-status', 'Current time is: ' + new Date());
	}
};

module.exports= function(options){
	mqtt_service.init(options);
	mqtt_service.setEvents();
	return mqtt_service;
};