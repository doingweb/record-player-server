import dotenv from 'dotenv';
import pino from 'pino';
import { exit } from 'process';
import MqttClient from './MqttClient';

dotenv.config();

const logger = pino({ name: '🚀 App Entry' });

const mqttTopic = 'play-this';

const mqttUrl = process.env.MQTT_URL || '';

if (!mqttUrl) {
  logger.error(new Error('Cannot start: MQTT_URL must be set'));
  exit();
}

logger.info('Here we go!');
logger.info(`🌲 NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`🌲 TS_NODE_DEV: ${process.env.TS_NODE_DEV}`);

(async () => {
  // TODO: Start the thing!
  const mqtt = new MqttClient(mqttUrl);
  mqtt.listen(mqttTopic, async (message) => {
    // TODO: Do actual things
    logger.info(`Message! ${message}`);
  });
})();
