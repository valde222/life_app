FROM alpine:3.22@sha256:2e0b81d60597f449baa56dc25d355367869d2dca4cd57e866f1e2b52af3eb55f
RUN apk add --no-cache age curl jq \
 && adduser -D -H -u 10001 backup
COPY backup.sh run.sh /
USER backup
HEALTHCHECK --interval=1h --timeout=10s --start-period=30m CMD find /target -name 'life-*.zip.age' -mtime -2 | grep -q .
CMD ["/bin/sh", "/run.sh"]
