from pathlib import Path
from typing import Union

from fastapi import FastAPI
import requests
import os
import gtfs_kit as gk

app = FastAPI()
apiKey = os.environ.get('apiKey')


@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/api")
def read_api():
    print(apiKey)
    r=requests.get("https://api.stm.info/pub/od/gtfs-rt/ic/v2/vehiclePositions/", headers={"accept": "application/x-protobuf", "apiKey": apiKey})
    return r.status_code

@app.get("/api/metro")
@app.get("/api/metro/{route_id}/{direction_id}/{timestamp}")
def get_metro_coordinates(route_id=1, direction_id=0,timestamp=0):
    path = Path('data/gtfs_stm.zip')

    feed = gk.read_feed(path, dist_units='km')

    return feed.validate()

    
    