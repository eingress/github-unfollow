# GitHub Unfollow

A Go program to follow people who follow you, and unfollow people who no longer follow you back.

## Usage

Create an API token with permission for _user -> user:follow_ at _<https://github.com/settings/tokens>_

Create a _.env_ file with the following contents (or just set an environment variable)

```sh
GITHUB_API_TOKEN=# Your API token
```

Then run it

### Install

Install the binary onto your `PATH` with:

```sh
go install github.com/eingress/github-unfollow@latest
```

This puts a `github-unfollow` binary in `$(go env GOPATH)/bin` (or `$(go env GOBIN)` if set). Ensure that directory is on your `PATH`, then run it from a directory containing your _.env_ file, or with the token exported:

```sh
export GITHUB_API_TOKEN=# Your API token
github-unfollow
```

### Shell

To run directly from a checkout without installing:

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
