#!/bin/sh
# Backs up a throwaway PocketBase with the real backup image, then restores the encrypted copy into a second one.
set -eu
cd "$(dirname "$0")/../.."
work=$(mktemp -d)
network=life-backup-test
cleanup() {
  docker rm -f life-backup-pb life-backup-job life-restore-pb >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
  docker run --rm -v "$work":/w alpine:3.22 rm -rf /w/data /w/target /w/restore >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT

docker build -q -t life-pocketbase:backup-test pocketbase >/dev/null
docker build -q -t life-backup:test deploy/backup >/dev/null
docker network create "$network" >/dev/null
mkdir -p "$work/data" "$work/target" "$work/restore"
chmod 755 "$work"
chmod 777 "$work/data" "$work/target" "$work/restore"
docker run --rm --entrypoint age-keygen life-backup:test > "$work/key.txt" 2>/dev/null
recipient=$(grep -o 'age1[0-9a-z]*' "$work/key.txt")

docker run -d --name life-backup-pb --network "$network" -v "$work/data":/pb/pb_data \
  -e PB_USER_EMAIL=me@example.com -e PB_USER_PASSWORD=backup-test-password \
  -e PB_ADMIN_EMAIL=admin@example.com -e "PB_ADMIN_PASSWORD=it's \"quoted\" \$and long" \
  life-pocketbase:backup-test >/dev/null
until docker exec life-backup-pb wget -q --spider http://127.0.0.1:8090/api/health 2>/dev/null; do sleep 1; done

token=$(docker exec life-backup-pb wget -qO- --header 'content-type: application/json' \
  --post-data '{"identity":"me@example.com","password":"backup-test-password"}' \
  http://127.0.0.1:8090/api/collections/users/auth-with-password | sed 's/.*"token":"\([^"]*\)".*/\1/')
docker exec life-backup-pb wget -qO- --header 'content-type: application/json' --header "authorization: $token" \
  --post-data '{"title":"Survives a restore"}' http://127.0.0.1:8090/api/collections/todos/records >/dev/null

docker run --rm --name life-backup-job --network "$network" \
  -v "$work/data":/pb_data:ro -v "$work/target":/target \
  -e PB_URL=http://life-backup-pb:8090 -e PB_ADMIN_EMAIL=admin@example.com \
  -e "PB_ADMIN_PASSWORD=it's \"quoted\" \$and long" -e BACKUP_KEEP_DAYS=14 -e "BACKUP_AGE_RECIPIENT=$recipient" \
  life-backup:test /bin/sh /backup.sh
docker rm -f life-backup-pb >/dev/null

file=$(ls "$work/target"/life-*.zip.age)
if unzip -l "$file" >/dev/null 2>&1; then
  echo "FAIL: the backup is readable without the key"; exit 1
fi
docker run --rm -v "$work":/w --entrypoint sh life-backup:test -c \
  "age -d -i /w/key.txt -o /w/restore/backup.zip /w/target/$(basename "$file") && cd /w/restore && unzip -q backup.zip && rm backup.zip"

docker run -d --name life-restore-pb -v "$work/restore":/pb/pb_data life-pocketbase:backup-test >/dev/null
until docker exec life-restore-pb wget -q --spider http://127.0.0.1:8090/api/health 2>/dev/null; do sleep 1; done
token=$(docker exec life-restore-pb wget -qO- --header 'content-type: application/json' \
  --post-data '{"identity":"me@example.com","password":"backup-test-password"}' \
  http://127.0.0.1:8090/api/collections/users/auth-with-password | sed 's/.*"token":"\([^"]*\)".*/\1/')
if docker exec life-restore-pb wget -qO- --header "authorization: $token" \
  http://127.0.0.1:8090/api/collections/todos/records | grep -q 'Survives a restore'; then
  echo "PASS: encrypted backup restored"
else
  echo "FAIL: the restored server lacks the todo"; exit 1
fi
