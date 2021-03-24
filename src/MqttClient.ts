import * as mqtt from 'mqtt';
import pino from 'pino';

const logger = pino({ name: '🦟 MqttClient' });

export default class MqttClient {
  private client: mqtt.MqttClient;

  constructor(url: string) {
    this.client = mqtt.connect(url);

    this.client.on('connect', () => {
      logger.info(`Connected to ${url}`);
    });

    this.client.on('error', (error) => {
      logger.error(error, 'MQTT error');
    });
  }

  listen(topic: string, handler: (message: string) => Promise<void>): void {
    this.client.subscribe(topic, (err) => {
      if (err) {
        logger.error(err, `Problem subscribing to topic "${topic}"`);
        return;
      }

      logger.info(`Subscribed to ${topic}`);
    });

    this.client.on('message', (receivedTopic, payload) => {
      const message = payload.toString('utf-8');

      logger.info(`Received message on ${receivedTopic}: "${message}"`);

      handler(message);
    });
  }
}
