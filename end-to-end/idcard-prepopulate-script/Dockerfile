FROM python:3

RUN apt-get update

RUN apt-get -y install nano

WORKDIR /usr/src/app
COPY idcard_fdp_content/ ./
COPY run.sh ./
COPY reset.sh ./
COPY test.xml ./
RUN pip install --no-cache-dir -r requirements.txt
CMD ["/bin/bash", "./run.sh"]
