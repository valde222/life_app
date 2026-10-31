set -eu
: "${BACKUP_AGE_RECIPIENT:?set BACKUP_AGE_RECIPIENT}"
name="life-$(date +%Y-%m-%d).zip"
credentials=$(jq -n --arg identity "$PB_ADMIN_EMAIL" --arg password "$PB_ADMIN_PASSWORD" '{identity: $identity, password: $password}')
token=$(curl -sSf -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
  -H 'content-type: application/json' -d "$credentials" | jq -r .token)
curl -sSf -X POST "$PB_URL/api/backups" -H "authorization: $token" \
  -H 'content-type: application/json' -d "$(jq -n --arg name "$name" '{name: $name}')" >/dev/null
age -r "$BACKUP_AGE_RECIPIENT" -o "/target/$name.age.partial" "/pb_data/backups/$name"
mv "/target/$name.age.partial" "/target/$name.age"
curl -sSf -X DELETE "$PB_URL/api/backups/$name" -H "authorization: $token"
find /target -name 'life-*.zip.age' -mtime +"$BACKUP_KEEP_DAYS" -delete
echo "Backed up $name.age"
