__author__ = 'Rajaram Kaliyaperumal'

class MetadataFile:
    id = None
    path = None
    type = None

    def __init__(self, id, path, type):
        self.id = id
        self.path = path
        self.type = type
