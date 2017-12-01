FROM python:3

WORKDIR /usr/src/app
COPY RIVM_FAIRDATA ./
RUN pip install --no-cache-dir -r requirements.txt
COPY run.sh ./
COPY reset.sh ./
COPY test.xml ./
CMD ["/bin/bash", "./run.sh"]