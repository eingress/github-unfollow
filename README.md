# GitHub Unfollow

A Bun script to follow people who follow you, and unfollow people who no longer follow you back.

## Usage

Create an API token with permission for _user -> user:follow_ at _<https://github.com/settings/tokens>_

Create a _.env_ file with the following contents (or just set an environment variable)

```sh
GITHUB_API_TOKEN=# Your API token
```

Then run it

### Shell

```sh
bun start
```

### Docker

```sh
GITHUB_API_TOKEN="Your API token" docker run -it ghcr.io/eingress/github-unfollow
```

or

```sh
docker run -it -v /path/to/.env:/app/.env ghcr.io/eingress/github-unfollow
```
