import bthomev1 from "./bthomev1.js";
import bthomev2 from "./bthomev2.js";

/**
 * @param {string?} bindKey
 * @returns {Parser}
 */
function bthome(bindKey) {
    /**
     * @param {string} topic
     * @param {Buffer} buffer
     * @returns {SensorReading}
     */
    function parse(topic, buffer) {
        /** @type BleMqttPacket */
        const message = JSON.parse(buffer.toString());

        // unencrypted v1
        if(Object.hasOwn(message.service_data, '0000181c-0000-1000-8000-00805f9b34fb'))
            return bthomev1(bindKey).parse(topic, buffer);
        // encrypted v1
        else if(Object.hasOwn(message.service_data, '0000181e-0000-1000-8000-00805f9b34fb'))
            return bthomev1(bindKey).parse(topic, buffer);
        // v2
        else if (Object.hasOwn(message.service_data, '0000fcd2-0000-1000-8000-00805f9b34fb'))
            return bthomev2(bindKey).parse(topic, buffer);
        else throw 'non-bthome advertisement';
    }

    return {parse};
}

export default bthome;