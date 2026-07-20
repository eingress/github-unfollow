# GitHub Unfollow

A Go program to follow people who follow you, and unfollow people who no longer follow you back.

## Usage

Create an API token with permission for _user -> user:follow_ at _<https://github.com/settings/tokens>_

Create a _.env_ file with the following contents (or just set an environment variable)

```sh
GITHUB_API_TOKEN=# Your API token
```

Then run it

### Shell

```sh
go run .
```

Run the tests with:

```sh
go test ./...
```

### Docker

```sh
docker run -it -e GITHUB_API_TOKEN="Your API token" ghcr.io/eingress/github-unfollow
```

or

```sh
docker run -it -v /path/to/.env:/.env ghcr.io/eingress/github-unfollow
```
