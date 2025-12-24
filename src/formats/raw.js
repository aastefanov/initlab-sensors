/**
 * @param {(topic: string, buffer: Buffer) => SensorReading} valueSelector
 * @returns {Parser}
 */
const raw = valueSelector => ({
    parse: (topic, buffer) => valueSelector(topic, buffer)
});

export default raw;