Buffer.prototype.readUInt24LE = function (offset) {
    // TODO: check if reversed
    return (1 << 16) * this.readUInt8(offset + 1) + this.readUInt16LE(offset);
}

Buffer.prototype.readUInt4 = function (offset) {
    return this.readUInt8(offset) & (1 << 4 - 1)
}

// see https://bthome.io/v1/
// see https://bthome.io/format/

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

/** @typedef {[string, (x: Buffer) => string | number, number]} EventData */
/** @type {{[type: number]: EventData}} */
const sensorMap = {
    0x00: ['id', x => x.readUInt8(),1],
    0x01: ['battery', x => x.readUInt8(),1],
    0x02: ['temperature', x => x.readInt16LE() / 100,2],
    0x03: ['humidity', x => x.readUInt16LE() / 100,2],
    0x2E: ['humidity', x => x.readUInt8(),1],
    0x04: ['pressure', x => x.readUInt24LE(),3],
    0x05: ['illuminance', x => x.readUInt24LE(),3],
    0x06: ['mass_kg', x => x.readUInt16LE() / 100,2],
    0x07: ['mass_lb', x => x.readUInt16LE() / 100,2],
    0x08: ['dewpoint', x => x.readInt16LE() / 100,2],
    0x09: ['count', x => x.readUInt4(),1],
    0x0A: ['energy', x => x.readUInt24LE() / 1000,3],
    0x0B: ['power', x => x.readUInt24LE() / 100,3],
    0x0C: ['voltage', x => x.readUInt16LE() / 1000,2],
    0x0D: ['pm2.5', x => x.readUInt16LE(),2],
    0x0E: ['pm10', x => x.readUInt16LE(),2],
    0x12: ['co2', x => x.readInt16LE(),2],
    0x13: ['tvoc', x => x.readUInt16LE(),2],
    0x14: ['moisture', x => x.readUInt16LE() / 100,2],
    0x2F: ['moisture', x => x.readUInt8(),1],
    0x50: ['timestamp', () => ''], // TODO: parse this
    0x51: ['acceleration', x => x.readUInt16LE() / 1000,2],
    0x52: ['gyroscope', x => x.readUInt16LE() / 1000,2],
    0x53: ['text', () => ''], // TODO: parse this
    0x54: ['raw', x => x.toString('hex')],
    // ...Object.fromEntries(
    //     Object.entries(boolMap).map(([c, m]) => [c, [m, x => x.readBoolean()]])
    // )
};

export {boolMap, eventMap, sensorMap};