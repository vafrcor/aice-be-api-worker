module.exports={
	"mqtt":{
		"host": process.env.DB_MQTT_HOST,
     	"port": parseInt(process.env.DB_MQTT_PORT),
      	"uri_segment_prefix": "/ws",
      	"identity_format": "be_{random}"
	},
	"object_broker":{
		"host": process.env.DB_MQTT_HOST,
		"default_protocol": process.env.DB_MQTT_PROTOCOL,
		"identity_format": "aice_be_{random}",
		"protocols": {
			"mqtt":{
				"url": "mqtt://"+process.env.DB_MQTT_HOST
			},
			"tcp":{
				"url": "tcp://"+process.env.DB_MQTT_HOST+":"+process.env.DB_MQTT_PORT
			},
			"ws":{
				"url": "ws://"+process.env.DB_MQTT_HOST+":"+process.env.DB_MQTT_PORT+"/ws"
			}
		}
	}
};
