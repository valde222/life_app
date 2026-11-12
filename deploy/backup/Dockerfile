FROM alpine:3.24@sha256:f59abe656b692d901e184be3445e084786602108599d2a51d229c0f5a48c71bf
RUN apk add --no-cache age curl jq \
 && adduser -D -H -u 10001 backup
COPY backup.sh run.sh /
USER backup
HEALTHCHECK --interval=1h --timeout=10s --start-period=30m CMD find /target -name 'life-*.zip.age' -mtime -2 | grep -q .
CMD ["/bin/sh", "/run.sh"]
