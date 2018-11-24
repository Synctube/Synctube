# Synctube

Realtime web video synchronization.

## Docker Usage

    docker build -t synctube .
    docker run --env-file .env -d -p 80:3000 synctube
