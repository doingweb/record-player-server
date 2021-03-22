import express from 'express';
import pino from 'pino';
import SpotifyClient from './SpotifyClient';

const logger = pino({ name: '🌎 HttpServer' });

export default class HttpServer {
  app: ReturnType<typeof express>;

  constructor(spotifyClient: SpotifyClient) {
    this.app = express();

    this.app.get('/', (req, res) => {
      res.send("Let's play some records 🔊");
    });

    this.app.get('/auth', (req, res) => {
      res.redirect(spotifyClient.getAuthorizeUrl());
    });

    this.app.get('/auth-callback', async (req, res) => {
      try {
        await spotifyClient.authorize(
          req.query.code?.toString() || '',
          req.query.state?.toString() || ''
        );

        res.send('🔓 Authorized');
      } catch (error) {
        logger.error(error, 'authorize() error');
        res.status(500).send('☹️ Error authorizing. See the server logs for details.');
      }
    });
  }

  start(): void {
    const port = process.env.HTTP_PORT;

    this.app.listen(port, () => {
      logger.info(`Web server listening on http://${process.env.HOSTNAME}:${port}`);
    });
  }
}
