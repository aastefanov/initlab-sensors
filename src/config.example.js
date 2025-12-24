import xiaomi from "./formats/xiaomi.js";


/** @type {Config} */
const config = {
    mqtt: {
        url: 'mqtt://localhost',
        options: {
            username: 'user', password: 'pass',
            clean: true,
        },
        subscribe: [
            'ble-events/+/+/ServiceDataAdvertisement',
        ]
    },

    sensors: {
        bigroom: {
            parser: xiaomi('insert_key_here'),
            match: {mac_address: 'AB:CD:EF:01:23:45'},
            publish: 'sensors/mi1',
        },
    }
};
export default config;