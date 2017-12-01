#printf "============== Running reset script to init demo env =============="
#sh reset.sh

cd script/src
rivmfdpURL="http://localhost:8500/fdp"
mappingsfdpURL="http://localhost:8501/fdp"
simpleServerURL="http://localhost:8503"

printf "============== POSTING RIVM metadata =============="
python3 run.py $rivmfdpURL $simpleServerURL

printf "============== POSTING RIVM metadata =============="
python3 run.py rivm $rivmfdpURL $simpleServerURL

printf "============== POSTING Mappings metadata =============="
python3 run.py mapping $mappingsfdpURL $simpleServerURL

cd /usr/src/app
sh reset.sh