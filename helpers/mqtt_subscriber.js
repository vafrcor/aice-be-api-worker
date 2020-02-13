const dotProp = require('dot-prop');
const _ = require('lodash');

var mqtt_subscriber= {
	data: {},
	init: function(options){
		var self=this;	
		this.debug= options.debug || false;
		this.data={
			objects: options.objects || {}
		}
	},
	processMessage: function(topic, message){
		var self=this;
		if(self.debug){
		console.log('--> MQTT Process Message  \\ Message Received ('+topic+'): ', message.toString());
		}
	}
};

module.exports= function(options){
	mqtt_subscriber.init(options);
	return mqtt_subscriber;
};