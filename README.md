# Synctube

Realtime web video synchronization.

## Docker Usage

    docker build -t synctube .
    docker run --env-file .env -d -p 80:3000 synctube

## Environment Variables

* `SYNCTUBE_CLIENT_YOUTUBE_APIKEY` - Browser API key for YouTube Data API v3
* `SYNCTUBE_SERVER_YOUTUBE_APIKEY` - Server API key for YouTube Data API v3
* `SYNCTUBE_YOUTUBE_BATCH_DELAY` - Number of milliseconds to wait to collect a batch of YouTube video info queries
* `SYNCTUBE_YOUTUBE_BATCH_LIMIT` - Maximum number of videos to query in one batch
* `SYNCTUBE_REDIS_URL` - URL of the Redis server
