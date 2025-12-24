#!/usr/bin/env node

import mqtt from 'mqtt';
import config from './config.js';

const client = mqtt.connect(config.mqtt.url, config.mqtt.options);

process.on('SIGINT', () => close());
client.on('error', (e) => console.error(e))
client.on('connect', () => onConnect());

function onConnect() {
    console.info(`connected to ${config.mqtt.url}`);

    for (const topic of config.mqtt.subscribe) {
        client.subscribe(topic, (err) => {
            if (err) console.error(err);
        });
    }

    client.on('message', (topic, buffer) => {
        let sensor = topicMatch(topic) ?? propMatch(buffer);
        if (!sensor) {
            console.debug(`Non-configured sensor: ${topic}`);
            return;
        }

        const sensorConfig = config.sensors[sensor];
        if (!sensorConfig.parser) {
            console.error(`Parser not configured for sensor ${sensor}`);
        }

        if (!sensorConfig.publish) {
            console.warn(`sensor ${sensor} does not have publish config`);
        }
        else {
            const data = sensorConfig.parser.parse(topic, buffer);
            for(const [measurement, rawValue] of Object.entries(data)) {
                const topic = `${sensorConfig.publish}/${measurement}`;
                const value = ({timestamp: Date.now(), value: rawValue});

                console.debug(`publishing value ${JSON.stringify(value)} to topic ${topic}`);
                client.publish(topic, JSON.stringify(value), {retain: true});
            }
        }
    })
}


function topicMatch(topic) {
    for (let [name, props] of Object.entries(config.sensors)) {
        if (!props.topic) continue;
        if (props.topic instanceof RegExp && props.topic.test(topic)) return name;
        else if (topic === props.topic) return name;
    }
}

function propMatch(buf) {
    try {
        const parsed = JSON.parse(buf.toString());
        for (let [name, props] of Object.entries(config.sensors)) {
            if (!props.match) continue;
            if (Object.entries(props.match)
                .every(([prop, expected]) => Object.hasOwn(parsed, prop) && parsed[prop] === expected)
            ) return name;
        }
    } catch (e) {
        return undefined;
    }
}


function close() {
    console.info('exiting');
    client.end(() => {
        console.info('disconnected');
    })
}
