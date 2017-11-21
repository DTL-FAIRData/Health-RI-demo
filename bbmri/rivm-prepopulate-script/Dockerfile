FROM python:3

WORKDIR /usr/src/app
COPY RIVM_FAIRDATA ./
RUN pip install --no-cache-dir -r requirements.txt

CMD [ "python", "./run.py", "http://localhost:8083/fdp", "http://localhost:8084/fairdatapoint/fdp"]
