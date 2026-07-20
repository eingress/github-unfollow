ARG GO_IMAGE_VERSION

FROM golang:${GO_IMAGE_VERSION:-alpine} AS builder

LABEL maintainer="Scott Mathieson <scott@eingress.io>"

RUN apk add --no-cache ca-certificates

RUN mkdir /build

COPY go.mod go.sum /build/
COPY *.go /build/

WORKDIR /build

RUN go env -w CGO_ENABLED=0 && \
    go build -a -o main .

FROM scratch

WORKDIR /

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /build/main .

ENTRYPOINT ["/main"]
