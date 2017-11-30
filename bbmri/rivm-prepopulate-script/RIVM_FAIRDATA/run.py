__author__ = 'Rajaram Kaliyaperumal'



import MetadataFile as mf
import requests
import os
import sys


class run:
    """
    Class handles interaction with FDP for RIVM_FAIRDATA data
    """

    def store_metadata(self, fdp_url, turtle_file_url):
        """
        Method to POST FAIR metadata to the FairDataPoint

        :param fdp_url: FDP base URL
        :param turtle_file_url: RIVM_FAIRDATA's data's turtle file url
        """
        # Remove trailing / from the url
        if fdp_url.endswith("/"):
            fdp_url = fdp_url[:-1]

        # catalog metadata dymanic properites that changes which the it stored in the FDP
        catalog_id = "healthData"
        catalog_uri_ph = "CATALOG_URI"
        catalog_uri = fdp_url + "/catalog/" + catalog_id
        # dataset metadata dymanic properites that changes which the it stored in the FDP
        dataset_id = "rivmSources"
        dataset_uri_ph = "DATASET_URI"
        dataset_uri = fdp_url + "/dataset/" + dataset_id

        dir_base = "resource/"
        # place holder for turtle URL in the metadata file
        turtle_ph = "TURTLE_LOCATION"

        files = [mf.MetadataFile(catalog_id, (dir_base + "catalog.ttl"), "/catalog"),
                 mf.MetadataFile(dataset_id, (dir_base + "dataset.ttl"), "/dataset"),
                 mf.MetadataFile("html", (dir_base + "distribution_html.ttl"), "/distribution"),
                 mf.MetadataFile("json", (dir_base + "distribution_json.ttl"), "/distribution"),
                 mf.MetadataFile("turtle", (dir_base + "distribution_turtle.ttl"), "/distribution")]
        for file in files:
            print("=========== Store metadata of "+file.id+" =====================")
            with open(file.path) as f:
                content = f.read()
                # Replacing place holder string in the files
                content = content.replace(catalog_uri_ph, catalog_uri)
                content = content.replace(dataset_uri_ph, dataset_uri)
                if turtle_file_url:
                    content = content.replace(turtle_ph, turtle_file_url)
                post_uri= (fdp_url + file.type + "?id=" + file.id)
                self.__post_call__(post_uri, content)

    def __post_call__(self, post_uri, content):
        """
        Method to make POST call to an REST API

        :param post_uri:    POST call url
        :param content: POST body content
        """
        headers = {'content-type': 'text/turtle'}
        r = requests.post(post_uri, data=content, headers=headers)
        print(r._content)


#fdp_url = "http://localhost:8084/fairdatapoint/fdp"
#turtle_file_url = "http://localhost:8084/fairdatapoint/fdp"
test = run()
if len(sys.argv) < 3:
    print("Insufficient params : ", str(len(sys.argv)))
else:
    print("Fdp url :",  str(sys.argv[1]))
    print("Turtle file url :",  str(sys.argv[2]))
test.store_metadata(str(sys.argv[1]), str(sys.argv[2]))





