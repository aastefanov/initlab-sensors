Buffer.prototype.readUInt24LE = function (offset) {
    // TODO: check if reversed
    return (1 << 16) * this.readUInt8(offset + 1) + this.readUInt16LE(offset);
}

Buffer.prototype.readUInt4 = function (offset) {
    return this.readUInt8(offset) & (1 << 4 - 1)
}

Buffer.prototype.readBoolean = function (offset) {
    return !!this.readUInt8(offset);
}

// see https://bthome.io    /v1/

/** @type {{[type: number]: string}} */
const boolMap = {
    0x0F: 'generic',
    0x10: 'power',
    0x11: 'opening',
    0x15: 'battery',
    0x16: 'charging',
    0x17: 'co',
    0x18: 'cold',
    0x19: 'connectivity',
    0x1A: 'door',
    0x1B: 'garage_door',
    0x1C: 'gas',
    0x1D: 'heat',
    0x1E: 'light',
    0x1F: 'lock',
    0x20: 'moisture',
    0x21: 'motion',
    0x22: 'moving',
    0x23: 'occupancy',
    0x24: 'plug',
    0x25: 'presence',
    0x26: 'problem',
    0x27: 'running',
    0x28: 'safety',
    0x29: 'smoke',
    0x2A: 'sound',
    0x2B: 'tamper',
    0x2C: 'vibration',
    0x2D: 'window',
}

const eventMap = {
    0x3A: ['button', {
        0x00: 'none',
        0x01: 'press',
        0x02: 'double_press',
        0x03: 'triple_press',
        0x04: 'long_press',
        0x05: 'long_double_press',
        0x06: 'long_triple_press',
    }],
    0x3c: ['dimmer', {
        0x00: 'none',
        0x01: ['rotate_left', (x => x.readUInt8)],
        0x02: ['rotate_right', (x => x.readUInt8)],
    }]
}

/** @typedef {[string, (x: Buffer) => string | number]} EventData */
/** @type {{[type: number]: EventData}} */
const map = {
    0x00: ['id', x => x.readUInt8()],
    0x01: ['battery', x => x.readUInt8()],
    0x02: ['temperature', x => x.readInt16LE() / 100],
    0x03: ['humidity', x => x.readUInt16LE() / 100],
    0x2E: ['humidity', x => x.readUInt8()],
    0x04: ['pressure', x => x.readUInt24LE()],
    0x05: ['illuminance', x => x.readUInt24LE()],
    0x06: ['mass_kg', x => x.readUInt16LE() / 100],
    0x07: ['mass_lb', x => x.readUInt16LE() / 100],
    0x08: ['dewpoint', x => x.readInt16LE() / 100],
    0x09: ['count', x => x.readUInt4()],
    0x0A: ['energy', x => x.readUInt24LE() / 1000],
    0x0B: ['power', x => x.readUInt24LE() / 100],
    0x0C: ['voltage', x => x.readUInt16LE() / 1000],
    0x0D: ['pm2.5', x => x.readUInt16LE()],
    0x0E: ['pm10', x => x.readUInt16LE()],
    0x12: ['co2', x => x.readInt16LE()],
    0x13: ['tvoc', x => x.readUInt16LE()],
    0x14: ['moisture', x => x.readUInt16LE() / 100],
    0x2F: ['moisture', x => x.readUInt8()],
    0x50: ['timestamp', () => ''], // TODO: parse this
    0x51: ['acceleration', x => x.readUInt16LE() / 1000],
    0x52: ['gyroscope', x => x.readUInt16LE() / 1000],
    0x53: ['text', () => ''], // TODO: parse this
    0x54: ['raw', x => x.toString('hex')],
    // ...Object.fromEntries(
    //     Object.entries(boolMap).map(([c, m]) => [c, [m, x => x.readBoolean()]])
    // )
};

/**
 * @param {string?} bindKey
 * @returns {Parser}
 */
function bthomev1(bindKey) {
    /**
     * @param {string} topic
     * @param {Buffer} buffer
     * @returns {SensorReading}
     */
    function parse(topic, buffer) {
        /** @type BleMqttPacket */
        const message = JSON.parse(buffer.toString());

        if (bindKey) throw 'kur';

        const packet =
            Buffer.from(message.service_data['0000181c-0000-1000-8000-00805f9b34fb'], 'hex');

        const packetLen = packet.length;
        const result = {};

        let offset = 0;
        while (offset < packetLen - 1) {
            // TODO: actually read datatype instead of using the recommended one
            const len = packet.readUInt8(offset++) & (0x00011111);
            const type = packet.readUInt8(offset++);
            const data = packet.subarray(offset, offset += len + 1);


            if (boolMap.hasOwnProperty(type)) {
                result[boolMap[type]] = data.readBoolean()
            } else if (eventMap.hasOwnProperty(type)) {
                const [entity, params] = eventMap[type];
                // TODO: clean this up
                if (Array.isArray(params)) { // has parser and attached values
                    const [event, fun] = params[1];
                    result[entity] = {event: event, value: fun(data)}
                } else { // no attached values
                    result[entity] = {event: params}
                }
            } else if (map.hasOwnProperty(type)) {
                const [measurement, fun] = map[type];
                result[measurement] = fun(data);
            } else {
                console.warn(`undefined bthome property: ${type.toString(16)}`);
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

export default bthomev1;