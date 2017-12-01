__author__ = 'Rajaram Kaliyaperumal'



import MetadataFile as mf
import requests
import os
import sys
import time


class run:
    """
    Class handles interaction with FDP for RIVM_FAIRDATA data
    """

    SIMPLE_SERVER_URI_PH = "SIMPLE_SERVER"
    dir_base = "resource/"
    MAX_RE_TRY = 6
    RE_TRY = 0

    def store_rivm_metadata(self, fdp_url, simple_server_url):
        """
        Method to POST FAIR metadata to the FairDataPoint

        :param fdp_url: FDP base URL
        :param turtle_file_url: RIVM_FAIRDATA's data's turtle file url
        """
        # Remove trailing / from the url
        if fdp_url.endswith("/"):
            fdp_url = fdp_url[:-1]

        # Remove trailing / from the simple_server_url
        if simple_server_url.endswith("/"):
            simple_server_url = simple_server_url[:-1]


        dir = self.dir_base + "rivm/"

        fdp_content = str = open(dir + 'repository.ttl', 'r').read()

        print("=========== Store repository metadata=====================")
        self.patch_metadata(fdp_url, fdp_content)

        # catalog metadata dymanic properites that changes which the it stored in the FDP
        catalog_id = "healthData"
        catalog_uri_ph = "CATALOG_URI"
        catalog_uri = fdp_url + "/catalog/" + catalog_id
        # dataset metadata dymanic properites that changes which the it stored in the FDP
        dataset_id = "rivmSources"
        dataset_uri_ph = "DATASET_URI"
        dataset_uri = fdp_url + "/dataset/" + dataset_id
        # place holder for turtle URL in the metadata file
        turtle_ph = "TURTLE_LOCATION"

        files = [mf.MetadataFile(catalog_id, (dir + "catalog.ttl"), "/catalog"),
                 mf.MetadataFile(dataset_id, (dir + "dataset.ttl"), "/dataset"),
                 mf.MetadataFile("html", (dir + "distribution_html.ttl"), "/distribution"),
                 mf.MetadataFile("json", (dir + "distribution_json.ttl"), "/distribution"),
                 mf.MetadataFile("turtle", (dir + "distribution_turtle.ttl"), "/distribution")]
        for file in files:
            print("=========== Store metadata of "+file.id+" =====================")
            with open(file.path) as f:
                content = f.read()
                # Replacing place holder string in the files
                content = content.replace(catalog_uri_ph, catalog_uri)
                content = content.replace(dataset_uri_ph, dataset_uri)
                content = content.replace(self.SIMPLE_SERVER_URI_PH, simple_server_url)
                post_uri= (fdp_url + file.type + "?id=" + file.id)
                self.__post_call__(post_uri, content)

    def store_mapping_metadata(self, fdp_url, simple_server_url):
        """
        Method to POST FAIR metadata to the FairDataPoint

        :param fdp_url: FDP base URL
        :param turtle_file_url: RIVM_FAIRDATA's data's turtle file url
        """
        # Remove trailing / from the url
        if fdp_url.endswith("/"):
            fdp_url = fdp_url[:-1]

        # Remove trailing / from the simple_server_url
        if simple_server_url.endswith("/"):
            simple_server_url = simple_server_url[:-1]


        dir = self.dir_base + "mapping/"

        fdp_content = str = open(dir + 'repository.ttl', 'r').read()

        print("=========== Store repository metadata=====================")
        self.patch_metadata(fdp_url, fdp_content)

        # catalog metadata dymanic properites that changes which the it stored in the FDP
        catalog_id = "mappings"
        catalog_uri_ph = "CATALOG_URI"
        catalog_uri = fdp_url + "/catalog/" + catalog_id
        # dataset metadata dymanic properites that changes which the it stored in the FDP
        dataset_id = "rivmToBBMRI-NL"
        dataset_uri_ph = "DATASET_URI"
        dataset_uri = fdp_url + "/dataset/" + dataset_id
        # place holder for turtle URL in the metadata file
        turtle_ph = "TURTLE_LOCATION"

        files = [mf.MetadataFile(catalog_id, (dir + "catalog.ttl"), "/catalog"),
                 mf.MetadataFile(dataset_id, (dir + "dataset.ttl"), "/dataset"),
                 mf.MetadataFile("turtle", (dir + "distribution_turtle.ttl"), "/distribution")]
        for file in files:
            print("=========== Store metadata of "+file.id+" =====================")
            with open(file.path) as f:
                content = f.read()
                # Replacing place holder string in the files
                content = content.replace(catalog_uri_ph, catalog_uri)
                content = content.replace(dataset_uri_ph, dataset_uri)
                content = content.replace(self.SIMPLE_SERVER_URI_PH, simple_server_url)
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

    def patch_metadata(self, patch_uri, content):
        try:
            headers = {'content-type': 'text/turtle'}
            r = requests.patch(patch_uri, data=content.encode('utf8'), headers=headers)
            print(r.headers)
        except:
            print("Error making POST call the script will redo the call after 30sec")
            print("No of max retry available : ", str(self.MAX_RE_TRY - self.RE_TRY))
            time.sleep(30)
            if (self.RE_TRY <= self.MAX_RE_TRY):
                self.RE_TRY = self.RE_TRY + 1
                print("Retry number : ", str(self.RE_TRY))
                self.patch_metadata(patch_uri, content)


#fdp_url = "http://localhost:8084/fairdatapoint/fdp"
#turtle_file_url = "http://localhost:8084/fairdatapoint/fdp"
test = run()
if len(sys.argv) < 4:
    print("Insufficient params : ", str(len(sys.argv)))
else:
    m_type = str(sys.argv[1]).lower()
    fdp_uri = str(sys.argv[2])
    s_server_uri = str(sys.argv[3])
    print("Metadata type :", m_type)
    print("Fdp uri :",  fdp_uri)
    print("Simple server uri :",  s_server_uri)

    if(m_type == "rivm"):
        test.store_rivm_metadata(fdp_uri, s_server_uri)
    elif(m_type.lower() == "mapping"):
        test.store_mapping_metadata(fdp_uri, s_server_uri)
    else:
        print("Unknown metadata type, provide either rivm (or) mapping as a 1st arg")





