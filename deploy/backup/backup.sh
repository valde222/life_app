set -eu
name="life-$(date +%Y-%m-%d).zip"
token=$(curl -sf -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
  -H 'content-type: application/json' \
  -d "{\"identity\":\"$PB_ADMIN_EMAIL\",\"password\":\"$PB_ADMIN_PASSWORD\"}" | jq -r .token)
curl -sf -X POST "$PB_URL/api/backups" -H "authorization: $token" \
  -H 'content-type: application/json' -d "{\"name\":\"$name\"}"
cp "/backups/$name" "/target/$name"
find /target -name 'life-*.zip' -mtime +"$BACKUP_KEEP_DAYS" -delete
curl -sf -X DELETE "$PB_URL/api/backups/$name" -H "authorization: $token"
echo "Backed up $name"
