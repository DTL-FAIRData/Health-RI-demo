#printf "============== Running reset script to init demo env =============="
#sh reset.sh

cd script/src
rivmfdpURL="http://localhost:8500/fdp"
simpleServerURL="http://localhost:8503/demo-content/rivm-sources.ttl"

printf "============== POSTING RIVM metadata =============="
python3 run.py $rivmfdpURL $simpleServerURL  