Record Player Server
====================

The thing that listens for messages from the record player device and then makes the music play.

Development
-----------

### Local

When working locally, just use a natively-installed instance of [mosquitto](https://mosquitto.org/):

```console
mosquitto -v
```

And then (in another terminal) start the app like any other node thing:

```console
yarn start
```

Input to the app can be achieved using `mosquitto_pub` if the physical device isn't handy:

```console
mosquitto_pub -t play-this -i test-sender-in-bash -m "https://open.spotify.com/playlist/37i9dQZF1DWZd79rJ6a7lp\?si\=EDGsRiMPSweQP3PNnoWQgw"
```

### Docker build

We can run a local docker build as well if desired:

```console
yarn docker
```

This will build and start up mosquitto and the app in a container (make sure your local mosquitto isn't running). This instance can be tested using the same `mosquitto_pub` command above.

Deployment
----------

Once your Raspberry Pi has been configured with the bare repo and app directory and the remote has been added, just push:

```console
git push stevedore
```

For this repo, the remote is named `stevedore`, and the Raspberry Pi's hostname is `stevedore.local`. If your Raspberry Pi has a different name, be sure to substitute it here and in the deployment scripts and environment variables.

Troubleshooting
---------------

### Docker Logs

First, SSH into the Raspberry Pi. Then you can get your container's ID:

```console
$ docker ps
CONTAINER ID   IMAGE                         COMMAND                  CREATED        STATUS        PORTS                                            NAMES
a8621dce9604   record-player-server_server   "docker-entrypoint.s…"   3 months ago   Up 13 days    0.0.0.0:8001->8001/tcp                           record-player-server_server_1
f997d2c572da   eclipse-mosquitto:latest      "/docker-entrypoint.…"   3 months ago   Up 3 months   0.0.0.0:1883->1883/tcp, 0.0.0.0:9001->9001/tcp   record-player-server_mqtt_1
```

Now we can start streaming the logs, piping it through pino-pretty:

```console
$ docker logs -f a8621dce9604 | npx pino-pretty --translateTime SYS:standard
[...]
[2021-07-19 12:22:04.919 -0700] INFO (🧑‍🎤 SpotifyClient/1 on a8621dce9604): 🔁 Refreshing access token
[2021-07-19 12:22:05.125 -0700] INFO (🧑‍🎤 SpotifyClient/1 on a8621dce9604): 🔓 New access token: BQBE...tjnX, refresh token: (undefined), expires in 3600 seconds.
[2021-07-19 13:10:41.382 -0700] INFO (🦟 MqttClient/1 on a8621dce9604): Received message on play-this: "open.spotify.com/album/5XmhHMj5LZLWo32aA6ntKE"
[2021-07-19 13:10:41.529 -0700] INFO (🧑‍🎤 SpotifyClient/1 on a8621dce9604): 📻 Playing 'spotify:album:5XmhHMj5LZLWo32aA6ntKE'
[2021-07-19 13:10:41.759 -0700] INFO (🧑‍🎤 SpotifyClient/1 on a8621dce9604): Success! [HTTP 204]
```

### Restarting the Containers

If it's not working for some reason (but not badly enough that it crashes and restarts itself), you can restart it by hand.

Change to the directory on the Raspberry Pi that contains your app:

```console
cd /opt/docker-apps/record-player-server/
```

Then restart using `docker-compose`:

```console
docker-compose restart
```
