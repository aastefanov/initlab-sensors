/**
 * @param {(topic: string, message: any) => SensorReading} valueSelector
 * @returns {Parser}
 */
const json = valueSelector => ({
    parse: (topic, buffer) => valueSelector(topic, JSON.parse(buffer.toString()))
});

export default json;