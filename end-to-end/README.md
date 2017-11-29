# Docker network setup

To get the `network_mode=host` type behaviour running on OSX, do the following:

If it is your first time running the end-to-end setup, create the docker network:
- make sure you run the latest version of docker-compose ([docker-compose up --no-start](https://docs.docker.com/compose/reference/up/) should be supported)
- run `docker-compose up --no-start`

When the network is created, do the next steps:
- run `docker network inspect endtoend_default | grep Gateway` and copy the IP address
- enter that IP address for each `extra_hosts` `localhost` mapping in the `docker-compose.yaml` file

JFM oneliner for OSX:

`sed -i '' "s/\"localhost:.*\"/\"localhost:$(docker network inspect endtoend_default | grep Gateway | awk '{gsub(/"/, ""); print $2}')\"/" docker-compose.yaml`

For linux:

`sed -i "s/\"localhost:.*\"/\"localhost:$(docker network inspect endtoend_default | grep Gateway | awk '{gsub(/"/, ""); print $2}')\"/" docker-compose.yaml`