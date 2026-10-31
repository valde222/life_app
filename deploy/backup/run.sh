set -eu
: "${BACKUP_AGE_RECIPIENT:?set BACKUP_AGE_RECIPIENT to an age public key; backups are never stored unencrypted}"
while true; do
  if [ "$(date +%H)" -ge "${BACKUP_HOUR:-3}" ] && [ ! -e "/target/life-$(date +%Y-%m-%d).zip.age" ]; then
    /bin/sh /backup.sh || echo "Backup failed; retrying in 10 minutes"
  fi
  sleep 600
done
