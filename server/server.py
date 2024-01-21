from pathlib import Path
from typing import Union
from datetime import timedelta

from fastapi import FastAPI
import requests
import os
import gtfs_kit as gk
import pandas as pd


app = FastAPI()
apiKey = os.environ.get('apiKey')

# Load GTFS feed once when the application starts
path = Path('data/gtfs_stm.zip')
feed = gk.read_feed(path, dist_units='km')
feed.validate()


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
def get_metro_coordinates(route_id=5, direction_id=0, timestamp=1705804156):
    # Get all trips
    trips_df = feed.trips

    print("All trips:")
    print(trips_df)

    # Convert direction_id to the expected data type if needed
    direction_id = int(direction_id)  # Adjust data type based on your GTFS data

    # Filter trips based on the specified route_id and direction_id
    trips_df = trips_df[(trips_df['route_id'] == route_id) & (trips_df['direction_id'] == direction_id)]

    print(f"Trips after filtering (route_id={route_id}, direction_id={direction_id}):")
    print(trips_df)

    if trips_df.empty:
        return {"error": f"No metro trips found for the given route_id={route_id} and direction_id={direction_id}"}

    # Get stoptimes for all selected trips
    stoptimes_df = feed.stop_times

    # Filter stoptimes based on the specified trip_ids
    selected_trip_ids = trips_df['trip_id'].tolist()
    stoptimes_for_selected_trips = stoptimes_df[stoptimes_df['trip_id'].isin(selected_trip_ids)]

    # Adjust timestamps by adding 24 hours where "24:" is present
    stoptimes_for_selected_trips['arrival_time'] += stoptimes_for_selected_trips['arrival_time'].apply(lambda x: timedelta(days=1) if "24:" in str(x) else timedelta(0))
    stoptimes_for_selected_trips['departure_time'] += stoptimes_for_selected_trips['departure_time'].apply(lambda x: timedelta(days=1) if "24:" in str(x) else timedelta(0))

    # Convert 'arrival_time' and 'departure_time' to Timestamp for proper comparison
    stoptimes_for_selected_trips['arrival_time'] = pd.to_datetime(stoptimes_for_selected_trips['arrival_time'], errors='coerce')
    stoptimes_for_selected_trips['departure_time'] = pd.to_datetime(stoptimes_for_selected_trips['departure_time'], errors='coerce')

    # Adjust timestamps by adding 24 hours where "24:" is present
    stoptimes_for_selected_trips['arrival_time'] += stoptimes_for_selected_trips['arrival_time'].apply(lambda x: timedelta(days=1) if "24:" in str(x) else timedelta(0))
    stoptimes_for_selected_trips['departure_time'] += stoptimes_for_selected_trips['departure_time'].apply(lambda x: timedelta(days=1) if "24:" in str(x) else timedelta(0))

    # Filter stoptimes based on the specified timestamp
    timestamp = pd.to_datetime(timestamp, unit='s')  # Convert timestamp to datetime

    in_transit_trains = stoptimes_for_selected_trips[
        (stoptimes_for_selected_trips['arrival_time'] >= timestamp) &
        (stoptimes_for_selected_trips['departure_time'] <= timestamp)
    ]

    if in_transit_trains.empty:
        return {"error": f"No metro trains in transit for the given timestamp, route_id={route_id}, and direction_id={direction_id}"}

    # Get the location information for each train in transit
    coordinates_list = []
    for _, row in in_transit_trains.iterrows():
        stop_id = row['stop_id']
        stop_info = feed.stops[feed.stops['stop_id'] == stop_id].squeeze()
        coordinates_list.append({"trip_id": row['trip_id'], "latitude": stop_info['stop_lat'], "longitude": stop_info['stop_lon']})

    return coordinates_list