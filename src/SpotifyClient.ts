import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import pino from 'pino';
import SpotifyWebApi from 'spotify-web-api-node';
import { v4 as uuid } from 'uuid';
import { abbr } from './util';

const logger = pino({ name: '🧑‍🎤 SpotifyClient' });

const dataFilePath = path.join('.data', 'spotify.json');
const authScopes = ['user-read-playback-state', 'user-modify-playback-state'];

export default class SpotifyClient {
  /**
   * Data that's persisted between server restarts
   */
  private data: SpotifyData = {};

  /**
   * How we talk to Spotify
   */
  private spotifyApi: SpotifyWebApi;

  /**
   * Helps ensure the integrity of our auth flow
   */
  private oauthCsrfState = '';

  constructor(clientId: string, clientSecret: string) {
    const redirectUri = `http://${process.env.HOSTNAME}:${process.env.HTTP_PORT}/auth-callback`;

    this.spotifyApi = new SpotifyWebApi({
      clientId,
      clientSecret,
      redirectUri,
    });
  }

  /**
   * Loads persisted data and sets up tokens if possible
   */
  async init(): Promise<void> {
    await this.loadData();

    if (this.data.refreshToken) {
      logger.info(`Found persisted refresh token: ${abbr(this.data.refreshToken)}`);

      this.spotifyApi.setRefreshToken(this.data.refreshToken);

      await this.refreshAccessToken();
    }
  }

  /**
   * Play a given thing from Spotify on the configured device
   *
   * @param {string} spotifyResourceUrl The URL of the thing from the Spotify app
   */
  async play(spotifyResourceUrl: string): Promise<void> {
    const urlRegex = new RegExp(
      'open.spotify.com/(?<resourceType>album|playlist)/(?<id>[A-Za-z0-9]+)'
    );
    const resourceMatch = urlRegex.exec(spotifyResourceUrl);

    if (!resourceMatch?.groups) {
      logger.warn(`Could not understand URL: ${spotifyResourceUrl}`);
      return;
    }

    const { resourceType, id } = resourceMatch.groups;

    const contextUri = `spotify:${resourceType}:${id}`;

    logger.info(`📻 Playing '${contextUri}'`);

    try {
      const response = await this.spotifyApi.play({
        context_uri: contextUri,
        device_id: process.env.SPOTIFY_DEVICE_ID,
      });

      logger.info(`Success! [HTTP ${response.statusCode}]`);
    } catch (error) {
      logger.error(error, 'Cannot play: Spotify API error');
    }
  }

  /**
   * Generate the URL to start a new OAuth flow
   */
  getAuthorizeUrl(): string {
    this.oauthCsrfState = uuid();
    return this.spotifyApi.createAuthorizeURL(authScopes, this.oauthCsrfState);
  }

  /**
   * Validates and converts an authorization code from Spotify into tokens
   */
  async authorize(code: string, csrfState: string): Promise<void> {
    this.verifyCsrf(csrfState);

    const { body } = await this.spotifyApi.authorizationCodeGrant(code);

    this.handleNewTokens(body);
  }

  private async refreshAccessToken() {
    logger.info('🔁 Refreshing access token');

    const { body } = await this.spotifyApi.refreshAccessToken();

    await this.handleNewTokens(body);
  }

  private async handleNewTokens({
    access_token,
    refresh_token,
    expires_in,
  }: RefreshAccessTokenResponse) {
    logger.info(
      `🔓 New access token: ${abbr(access_token)}, refresh token: ${abbr(
        refresh_token
      )}, expires in ${expires_in} seconds.`
    );

    this.spotifyApi.setAccessToken(access_token);

    if (refresh_token) {
      this.spotifyApi.setRefreshToken(refresh_token);
      this.data.refreshToken = refresh_token;
      await this.saveData();
    }

    setTimeout(() => this.refreshAccessToken(), expires_in * 1000);
  }

  private async loadData() {
    let dataJson;

    logger.info('Loading data file');

    try {
      dataJson = await readFile(dataFilePath, 'utf-8');
    } catch (error) {
      logger.error(error, 'Unable to open data file');
      dataJson = '{}';
    }

    this.data = JSON.parse(dataJson);
  }

  private async saveData() {
    await writeFile(dataFilePath, JSON.stringify(this.data));
    logger.info('💾 Saved data file');
  }

  private verifyCsrf(csrfState: string) {
    const expectedCsrfState = this.oauthCsrfState;
    this.oauthCsrfState = '';

    if (!(expectedCsrfState && csrfState && expectedCsrfState === csrfState)) {
      throw new Error('Possible CSRF detected! Aborting authorization.');
    }
  }
}

/**
 * Data that's persisted between restarts
 */
type SpotifyData = {
  refreshToken?: string;
};

// From https://github.com/DefinitelyTyped/DefinitelyTyped/blob/022e8d2be56f7602bfd91ae545597fdcba855fd9/types/spotify-web-api-node/index.d.ts#L1233-L1239
interface RefreshAccessTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}
