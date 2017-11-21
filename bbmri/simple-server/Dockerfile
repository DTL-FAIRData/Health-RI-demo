FROM tomcat:8.0-alpine

MAINTAINER Rajaram Kaliyaperumal <rr.kaliyaperumal@gmail.com>

# Make rdc-demo-dataset dir
RUN mkdir -p /usr/local/tomcat/webapps/demo-content

# Copy rdf files requried for demonstrator tool
COPY demo-content /usr/local/tomcat/webapps/demo-content
