# Docker network setup

To get the `network_mode=host` type behaviour running on OSX, do the following:

- run `docker network inspect endtoend_demo-net | grep Gateway` and copy the IP address
- enter that IP address for each `extra_hosts` `localhost` mapping in the `docker-compose.yaml` file