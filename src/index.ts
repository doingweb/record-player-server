import dotenv from 'dotenv';
import pino from 'pino';

dotenv.config();

const logger = pino({ name: '🚀 App Entry' });

logger.info('Here we go!');
logger.info(`🌲 NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`🌲 TS_NODE_DEV: ${process.env.TS_NODE_DEV}`);

(async () => {
  // TODO: Start the thing!
})();
