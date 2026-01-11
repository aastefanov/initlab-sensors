import {boolMap, eventMap, sensorMap} from './bthome_common.js';

/**
 * @param {string?} bindKey
 * @returns {Parser}
 */
function bthomev2(bindKey) {
    /**
     * @param {string} topic
     * @param {Buffer} buffer
     * @returns {SensorReading}
     */
    function parse(topic, buffer) {
        /** @type BleMqttPacket */
        const message = JSON.parse(buffer.toString());

        if (bindKey) throw 'not implemented';

        const packet =
            Buffer.from(message.service_data['0000fcd2-0000-1000-8000-00805f9b34fb'], 'hex');

        const packetLen = packet.length;
        const result = {};

        const header = packet.readUInt8();
        const encrypted = !!(header & 0b1);
        const version = (header & 0b11100000) >> 5;

        if (encrypted) throw 'not implemented';
        if (version !== 2) throw 'not implemented';

        let offset = 1;
        while (offset < packetLen - 1) {
            // TODO: actually read datatype instead of using the recommended one
            const type = packet.readUInt8(offset++);

            if (boolMap.hasOwnProperty(type)) {
                result[boolMap[type]] = !!packet.readUInt8(offset++);
            } else if (eventMap.hasOwnProperty(type)) {
                // todo: fix this
                throw 'not implemented';
            } else if (sensorMap.hasOwnProperty(type)) {

                const [measurement, fun, len] = sensorMap[type];
                result[measurement] = fun(packet.subarray(offset, offset += len));
            } else {
                console.warn(`undefined bthome property: 0x${type.toString(16)}`);
            }
        }

        return {
            rssi: message.rssi,
            address: message.mac_address,
            name: message.local_name,
            ...result
        }
    }

    return {parse};
}

export default bthomev2;