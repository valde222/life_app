FROM alpine:3.22@sha256:2e0b81d60597f449baa56dc25d355367869d2dca4cd57e866f1e2b52af3eb55f

ARG PB_VERSION=0.40.4
ARG PB_SHA256_AMD64=9042ec818570e79c3628dadcd0a756c1496d9e1173918ec409d133c02f82e5fa
ARG PB_SHA256_ARM64=86095bf8ed9345954f0d2bf0a5fb9b57584ae60b77ebf3b6cd23a8003a3fd418
ARG TARGETARCH

RUN apk add --no-cache ca-certificates \
 && wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" -O /tmp/pb.zip \
 && if [ "$TARGETARCH" = arm64 ]; then sum="$PB_SHA256_ARM64"; else sum="$PB_SHA256_AMD64"; fi \
 && echo "$sum  /tmp/pb.zip" | sha256sum -c - \
 && unzip /tmp/pb.zip pocketbase -d /pb \
 && rm /tmp/pb.zip \
 && adduser -D -H -u 10001 pocketbase \
 && mkdir -p /pb/pb_data \
 && chown pocketbase:pocketbase /pb/pb_data

COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks
COPY entrypoint.sh /pb/entrypoint.sh

USER pocketbase
EXPOSE 8090
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q --spider http://127.0.0.1:8090/api/health || exit 1
ENTRYPOINT ["/bin/sh", "/pb/entrypoint.sh"]
