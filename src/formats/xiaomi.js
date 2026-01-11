import {createDecipheriv} from 'crypto'

/**
 * @param {string?} miKey
 * @returns {Parser}
 */
function xiaomi(miKey) {
    /**
     * @param {string} topic
     * @param {Buffer} buffer
     * @returns {SensorReading}
     */
    function parse(topic, buffer) {
        /** @type BleMqttPacket */
        const message = JSON.parse(buffer.toString());

        const packet =
            Buffer.from(message.service_data['0000fe95-0000-1000-8000-00805f9b34fb'], 'hex');

        const serviceData = readAll(packet, miKey);

        const eventData = serviceData.event ? serviceData.event.data : {};
        return {
            rssi: message.rssi,
            address: message.mac_address,
            name: message.local_name,
            ...eventData
        };
    }

    return {parse};
}

// import ccm from "aes-ccm";

const FRAME_CONTROL = {
    FACTORY_NEW: 0b1,
    CONNECTING: 0b10,
    IS_CENTRAL: 0b100,
    IS_ENCRYPTED: 0b1000,
    MAC_INCLUDE: 0b10000,
    CAPABILITY_INCLUDE: 0b100000,
    EVENT_INCLUDE: 0b1000000,
    MANU_DATA_INCLUDE: 0b10000000,
    MANU_TITLE_INCLUDE: 0b100000000,
    BINDING_CFM: 0b1000000000,
};

export function decrypt(key, data) {
    const [desc, offset] = readServiceData(data)

    const bindKey = Buffer.from(key, 'hex');
    const aad = Buffer.of(0x11);
    const eventData = data.subarray(offset);
    const authTag = data.subarray(data.length - 4);

    const nonceKey = eventData.subarray(eventData.length - 7, eventData.length - 4);

    const payload = eventData.subarray(0, eventData.length - 7);

    const nonce = Buffer.concat([
        desc.mac, desc.productId, desc.counter, nonceKey
    ])

    const cipher = createDecipheriv('aes-128-ccm', bindKey, nonce, {
        authTagLength: 4,
    });

    cipher.setAuthTag(authTag);
    cipher.setAAD(aad, {plaintextLength: payload.length});

    /** @type Buffer */
    const received = cipher.update(payload, null);

    try {
        cipher.final();
    } catch (e) {
        console.error(`cannot decrypt xiaomi packet for device ${desc.mac}`)
        return undefined;
    }
    return received;
}

const EVENT_ID = {
    4106: (buffer, offset) => ({battery: buffer.readUInt8(offset)}),
    4109: (buffer, offset) => ({
        temperature: buffer.readUInt16LE(offset) / 10,
        humidity: buffer.readUInt16LE(offset + 2) / 10,
    }),
    4102: (buffer, offset) => ({humidity: buffer.readUInt16LE(offset) / 10}),
    4100: (buffer, offset) => ({temperature: buffer.readUInt16LE(offset) / 10}),
};

function readServiceData(data) {
    if (data.length < 5) return null;
    const buffer = Buffer.from(data);
    const result = {};
    let offset = 5;

    const frameControl = ((buffer.readUInt8(1) << 8) + buffer.readUInt8(0));
    result.productId = buffer.subarray(2, 4);
    result.counter = buffer.subarray(4, 5);


    result.frameControl = Object.keys(FRAME_CONTROL).map(id => {
        return (FRAME_CONTROL[id] & frameControl) && id;
    }).filter(Boolean);

    result.frameControlFields = frameControl;

    if (frameControl & FRAME_CONTROL.MAC_INCLUDE) {
        if (data.length < offset + 6) return null;
        result.mac = buffer.subarray(offset, offset + 6);
        offset += 6;
    }

    if (frameControl & FRAME_CONTROL.CAPABILITY_INCLUDE) {
        if (data.length < offset + 1) return null;
        result.capability = buffer.readUInt8(offset);
        offset++;
    }

    return [result, offset];
}

function readAll(data, key = undefined) {
    let [result, offset] = readServiceData(data)

    if (result.frameControlFields & FRAME_CONTROL.EVENT_INCLUDE) {

        if (data.length < offset + 3) return null;

        // if (frameControl & FRAME_CONTROL.IS_ENCRYPTED) result.eventRaw = buff.subarray(offset);
        if (result.frameControlFields & FRAME_CONTROL.IS_ENCRYPTED) result.event = readEventData(decrypt(key, data), 0);
        else result.event = readEventData(data, offset)
    }

    return result;
}

/**
 *
 * @param {Buffer} buffer
 * @param {number} offset
 * @returns {{eventID: number, length: number, raw: Buffer, data: Buffer }}
 */
function readEventData(buffer, offset = 0) {
    const eventID = buffer.readUInt16LE(offset);
    const length = buffer.readUInt8(offset + 2);
    let data;

    if (EVENT_ID[eventID] && buffer.length >= (offset + 3 + length)) {
        data = EVENT_ID[eventID](buffer, offset + 3);
    }

    return {
        eventID, length,
        raw: buffer.subarray(offset + 3, (offset + 3 + length)),
        data,
    }
}

export default xiaomi;