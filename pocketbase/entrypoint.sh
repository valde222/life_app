set -e
cd /pb
./pocketbase migrate up
exec ./pocketbase serve --http=0.0.0.0:8090 --automigrate=false
