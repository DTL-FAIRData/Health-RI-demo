__author__ = 'rajaram'

import requests
import os
import sys
import time


class IDCard:

     # BASE_URI placeholder in the file
    BASE_URI_PH =  "BASE_URI"
    FDP_URI_PH = BASE_URI_PH + "/fdp"
    SIMPLE_SERVER_URI_PH = "SIMPLE_SERVER"
    DIR_NAME = "../../fdp-metadata/id-card"
    MAX_RE_TRY = 6
    RE_TRY = 0


    def store_metadata(self, m_type, fdp_url, simple_server_url):

        # Remove trailing / from the fdp_url
        if fdp_url.endswith("/"):
            fdp_url = fdp_url[:-1]

        # Remove trailing / from the simple_server_url
        if simple_server_url.endswith("/"):
            simple_server_url = simple_server_url[:-1]
        dir = "../../fdp-metadata/demo-fdp"
        if((m_type == "biobank") or (m_type == "registry")):
            dir = self.DIR_NAME

        fdp_content = str = open(dir + '/fdp_'+m_type+'.ttl', 'r').read()

        print("=========== Store repository metadata=====================")
        self.patch_metadata(fdp_url, fdp_content)

        print("=========== Store catalog metadata=====================")
        catalog_dir = dir +"/catalog/" + m_type
        catalog_post_uri= (fdp_url + "/catalog/?id=")
        self.post_metadata_dir(catalog_dir, catalog_post_uri, fdp_url, simple_server_url)

        print("=========== Store datatset metadata=====================")
        dataset_dir = dir +"/dataset/" + m_type
        dataset_post_uri= (fdp_url + "/dataset/?id=")
        self.post_metadata_dir(dataset_dir, dataset_post_uri, fdp_url, simple_server_url)

        if(m_type != "demo"):
            print("=========== Store distribution datatset metadata=====================")
            distribution_dir = dir +"/distribution"
            distribution_post_uri= (fdp_url + "/distribution/?id=")
            self.post_metadata_dir(distribution_dir, distribution_post_uri, fdp_url, simple_server_url)


    def post_metadata_dir(self, dir, post_uri, fdp_url, simple_server_url):

        for file in os.listdir(dir):
            file_name = file.split(".ttl")[0]
            file_url =  dir + "/" + file
            base_url = fdp_url.replace("/fdp", "")
            print("FileName :", file)
            with open(file_url) as f:
                file_content = f.read()
                file_content = file_content.replace(self.FDP_URI_PH, fdp_url)
                file_content = file_content.replace(self.SIMPLE_SERVER_URI_PH, simple_server_url)
                file_content = file_content.replace(self.BASE_URI_PH, base_url)
                #print(file_content)
                self.post_metadata((post_uri  + file_name), file_content)

    def post_metadata(self, post_uri, content):
        headers = {'content-type': 'text/turtle'}
        #print(content)
        r = requests.post(post_uri, data=content.encode('utf8') , headers=headers)
        print(r.headers)

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



test = IDCard()
fdp_uri = "http://localhost:8084/fairdatapoint/fdp"
simple_server_url = "http://localhost:8079/"
#test.biobank(fdp_uri, simple_server_url)

if len(sys.argv) < 4:
    print("Insufficient params : ", str(len(sys.argv)))
else:
    m_type = str(sys.argv[1]).lower()
    fdp_uri = str(sys.argv[2])
    s_server_uri = str(sys.argv[3])
    print("Metadata type :", m_type)
    print("Fdp uri :",  fdp_uri)
    print("Simple server uri :",  s_server_uri)

    if(m_type == "biobank"):
        test.store_metadata(m_type, fdp_uri, s_server_uri)
    elif(m_type.lower() == "registry"):
        test.store_metadata(m_type, fdp_uri, s_server_uri)
    elif(m_type.lower() == "demo"):
        test.store_metadata(m_type, fdp_uri, s_server_uri)
    else:
        print("Unknown metadata type, provide either biobank (or) registry as a 1st arg")

