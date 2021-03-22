import dotenv from 'dotenv';
import pino from 'pino';
import { exit } from 'process';
import HttpServer from './HttpServer';
import MqttClient from './MqttClient';
import SpotifyClient from './SpotifyClient';

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
  const spotifyClient = new SpotifyClient(
    process.env.SPOTIFY_CLIENTID || '',
    process.env.SPOTIFY_CLIENTSECRET || ''
  );
  await spotifyClient.init();

  const httpServer = new HttpServer(spotifyClient);
  httpServer.start();

  const mqtt = new MqttClient(mqttUrl);
  mqtt.listen(mqttTopic, async (message) => {
    await spotifyClient.play(message);
  });
})();
