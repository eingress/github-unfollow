
ARG ALPINE_IMAGE_VERSION

FROM alpine:$ALPINE_IMAGE_VERSION as alpine-node

RUN apk --update --no-cache add nodejs yarn

FROM alpine-node as build

WORKDIR /build

COPY . .

RUN yarn install && \
	yarn build

FROM alpine:$ALPINE_IMAGE_VERSION as release

LABEL maintainer "Scott Mathieson <scott@eingress.io>"

WORKDIR /app

COPY package.json yarn.lock /app/

COPY --from=build /build/dist /app/dist

RUN apk --update --no-cache add nodejs yarn && \
	yarn install --production && \
	yarn cache clean && \
	apk del yarn

ENTRYPOINT ["node"]

CMD ["dist/index.js"]
