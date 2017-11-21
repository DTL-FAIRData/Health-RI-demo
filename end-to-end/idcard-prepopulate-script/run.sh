cd script/src
biobankfdpURL="http://localhost:8079/fdp"
registryfdpURL="http://localhost:8081/fdp"
simpleServerURL="http://localhost:8083/"

echo "============== POSTING Idcard's biobank metadata =============="
python3 idcard.py biobank $biobankfdpURL $simpleServerURL  

echo "============== POSTING Idcard's registry metadata =============="
python3 idcard.py registry $registryfdpURL $simpleServerURL
