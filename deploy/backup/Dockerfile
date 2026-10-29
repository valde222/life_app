FROM alpine:3.22
RUN apk add --no-cache curl jq
COPY backup.sh /backup.sh
RUN echo "30 3 * * * /bin/sh /backup.sh" > /etc/crontabs/root
CMD ["crond", "-f", "-l", "8"]
