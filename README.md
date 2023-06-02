# Github Unfollow

A nodejs script to unfollow all those lovely people who dont follow you back.

## Usage
Create an api token with permission for _user -> user:follow_ at _https://github.com/settings/tokens_

Create an _.env_ file with the following contents (or just set an environment variable)

```sh
GITHUB_API_TOKEN=# Your API token
```

Then run it

### Shell
```sh
yarn start
```
Or

### Docker

```sh
GITHUB_API_TOKEN="Your API token"; docker run -it eingressio/github-unfollow
```
or

```sh
docker run -it -v /path/to/.env:/app/.env eingressio/github-unfollow
```

