
ARG ALPINE_IMAGE_VERSION

FROM alpine:${ALPINE_IMAGE_VERSION:-3.20} AS alpine-node

RUN apk --update --no-cache add nodejs yarn

FROM alpine-node AS build

WORKDIR /build

COPY . .

RUN yarn install && \
	yarn build

FROM alpine:${ALPINE_IMAGE_VERSION:-3.20} AS release

LABEL maintainer="Scott Mathieson <scott@eingress.io>"

WORKDIR /app

COPY package.json yarn.lock /app/

COPY --from=build /build/dist /app/dist

RUN apk --update --no-cache add nodejs yarn && \
	yarn install --production && \
	yarn cache clean && \
	rm -f package.json yarn.lock && \
	apk del yarn

ENTRYPOINT ["node"]

CMD ["dist/index.js"]