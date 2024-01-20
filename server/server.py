from typing import Union

from fastapi import FastAPI
import requests
import os

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

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}
