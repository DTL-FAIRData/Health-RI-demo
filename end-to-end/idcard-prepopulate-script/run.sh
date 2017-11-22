printf "============== Running reset script to init demo env =============="
sh reset.sh

cd script/src
biobankfdpURL="http://localhost:8501/fdp"
registryfdpURL="http://localhost:8500/fdp"
simpleServerURL="http://localhost:8503/"

printf "============== POSTING Idcard's biobank metadata =============="
python3 idcard.py biobank $biobankfdpURL $simpleServerURL  

printf "============== POSTING Idcard's registry metadata =============="
python3 idcard.py registry $registryfdpURL $simpleServerURL