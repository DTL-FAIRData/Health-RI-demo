FROM python:3

WORKDIR /usr/src/app
COPY idcard_fdp_content/ ./
COPY run.sh ./
#COPY ../reset.sh ./
RUN pip install --no-cache-dir -r requirements.txt
CMD ["/bin/bash", "./run.sh"]
