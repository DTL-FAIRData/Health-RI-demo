FROM python:3

WORKDIR /usr/src/app
COPY RIVM_FAIRDATA ./
RUN pip install --no-cache-dir -r requirements.txt
COPY run.sh ./
CMD ["/bin/bash", "./run.sh"]