/**
 * @typedef {Object} SensorReadingBase
 // * @property {[measurement: string]: string | number}
 // * @property {number | undefined} temperature
 // * @property {number | undefined} humidity
 // * @property {number | undefined} battery
 // * @property {number | undefined} rssi
 * @property {string} name
 * @property {string} address */

/**
 * @typedef {SensorReadingBase & {[prop: string]: number|string} } SensorReading
 */

/**
 * @typedef {Object} Parser
 * @property {(topic: string, buf: Buffer) => SensorReading} parse
 */

/**
 * @typedef {Object} BleMqttPacket
 * @property {string} mac_address
 * @property {number} rssi
 * @property {string} id
 * @property {string?} local_name
 * @property {{[key: string]: string}?} service_data
 * @property {any} manufacturer_data
 */


/**
 * @typedef {Object} MqttConfig
 * @property {string} url
 * @property {import('mqtt').IClientOptions} options
 * @property {string[]} subscribe
 */
/**
 * @typedef {Object} SensorConfig
 * @property {Parser} parser
 * @property {{[key: string]: string}?} match
 * @property {string|RegExp?} topic
 */
/**
 * @typedef {Object} Config
 * @property {MqttConfig} mqtt
 * @property {{[name:string]: SensorConfig}} sensors
 */