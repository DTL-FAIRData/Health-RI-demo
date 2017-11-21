cd script/src
biobankfdpURL="http://localhost:8500/fdp"
registryfdpURL="http://localhost:8501/fdp"
simpleServerURL="http://localhost:8503/"

echo "============== POSTING Idcard's biobank metadata =============="
python3 idcard.py biobank $biobankfdpURL $simpleServerURL  

echo "============== POSTING Idcard's registry metadata =============="
python3 idcard.py registry $registryfdpURL $simpleServerURL
