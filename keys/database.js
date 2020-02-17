module.exports={
	"mqtt":{
		"host": process.env.DB_MQTT_HOST,
     	"port": parseInt(process.env.DB_MQTT_PORT),
      	"uri_segment_prefix": "/ws",
      	"identity_format": "be_{random}"
	}
};
