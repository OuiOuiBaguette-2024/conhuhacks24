from pathlib import Path
from typing import Union
from datetime import datetime, timedelta

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

stops_df = feed.stops
shapes_df = feed.shapes

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/api")
def read_api():
    print(apiKey)
    r=requests.get("https://api.stm.info/pub/od/gtfs-rt/ic/v2/vehiclePositions/", headers={"accept": "application/x-protobuf", "apiKey": apiKey})
    return r.status_code

def convert_time(time_str):
    # Convert time with "24:" to the next day
    if time_str.startswith("24:"):
        time_str = "00" + time_str[2:]
        return timedelta(days=1, hours=int(time_str[:2]), minutes=int(time_str[3:5]), seconds=int(time_str[6:]))
    else:
        return timedelta(hours=int(time_str[:2]), minutes=int(time_str[3:5]), seconds=int(time_str[6:]))


@app.get("/api/metro")
@app.get("/api/metro/{route_id}/{direction_id}/{timestamp}")
def get_metro_coordinates(route_id=5, direction_id=0, timestamp=0):
    timestamp_datetime = datetime.utcfromtimestamp(int(timestamp))
    trips_df = feed.trips
    direction_id = int(direction_id)

    trips_df = trips_df[(trips_df['route_id'] == route_id) & (trips_df['direction_id'] == direction_id)]

    if trips_df.empty:
        return {"error": f"No metro trips found for the given route_id={route_id} and direction_id={direction_id}"}

    stop_times_df = feed.stop_times.merge(trips_df[['trip_id']], on='trip_id')

    first_last_stop_times = stop_times_df.groupby('trip_id').agg(
        first_stop_sequence=('stop_sequence', 'min'),
        last_stop_sequence=('stop_sequence', 'max'),
        first_stop_time=('arrival_time', 'first'),
        last_stop_time=('departure_time', 'last')
    ).reset_index()

    first_last_stop_times['first_stop_time'] = timestamp_datetime.replace(hour=0, minute=0, second=0) + \
                                               first_last_stop_times['first_stop_time'].apply(convert_time)
    first_last_stop_times['last_stop_time'] = timestamp_datetime.replace(hour=0, minute=0, second=0) + \
                                              first_last_stop_times['last_stop_time'].apply(convert_time)

    active_trips = first_last_stop_times[
        (first_last_stop_times['first_stop_time'] <= timestamp_datetime) &
        (timestamp_datetime <= first_last_stop_times['last_stop_time'])
    ]

    if active_trips.empty:
        return {"message": "No active trips at the specified timestamp"}

    
    result = []


    for index, active_trip in active_trips.iterrows():
        trip_id = active_trip['trip_id']

        # Get all stop times for the current trip
        stop_times_trip_df = stop_times_df[stop_times_df['trip_id'] == trip_id]

        # Extract date from timestamp_datetime
        date_component = timestamp_datetime.strftime('%Y-%m-%d')

        # Get the arrival and departure times for each stop in the trip
        stop_times_trip_df['arrival_time'] = pd.to_datetime(stop_times_trip_df['arrival_time'], format='%H:%M:%S', errors='coerce')
        stop_times_trip_df['departure_time'] = pd.to_datetime(stop_times_trip_df['departure_time'], format='%H:%M:%S', errors='coerce')

        # Check if the timestamp is within the departure time of one station and the arrival time of the next station
        for i in range(len(stop_times_trip_df) - 1):
            # Replace NaT with a default date and then replace the date component
            departure_time_current = pd.to_datetime(f"{date_component} {stop_times_trip_df.iloc[i]['departure_time'].time()}", format='%Y-%m-%d %H:%M:%S', errors='coerce')
            arrival_time_next = pd.to_datetime(f"{date_component} {stop_times_trip_df.iloc[i + 1]['arrival_time'].time()}", format='%Y-%m-%d %H:%M:%S', errors='coerce')

            if departure_time_current <= timestamp_datetime <= arrival_time_next:
                current_stop_sequence = stop_times_trip_df.iloc[i]['stop_sequence']

                # Get the stop before and after the current location
                stop_after_df = pd.merge(stop_times_trip_df[stop_times_trip_df['stop_sequence'] == current_stop_sequence + 1], stops_df, how='left', on='stop_id')
                current_stop_df = pd.merge(stop_times_trip_df[stop_times_trip_df['stop_sequence'] == current_stop_sequence], stops_df, how='left', on='stop_id')

                # Check if the DataFrames are not empty before accessing iloc[0]
                current_stop = current_stop_df[['stop_name', 'stop_lat', 'stop_lon']].iloc[0] if not current_stop_df.empty else None
                stop_after = stop_after_df[['stop_name', 'stop_lat', 'stop_lon']].iloc[0] if not stop_after_df.empty else None

                # Calculate the midpoint coordinates
                if current_stop is not None and stop_after is not None:
                    time_elapsed = timestamp_datetime - departure_time_current
                    time_to_next_stop = arrival_time_next - timestamp_datetime

                    # Calculate the weighted average position
                    weight_before = time_to_next_stop.total_seconds() / (time_elapsed.total_seconds() + time_to_next_stop.total_seconds())
                    weight_after = 1 - weight_before

                    position_lat = (weight_before * current_stop['stop_lat']) + (weight_after * stop_after['stop_lat'])
                    position_lon = (weight_before * current_stop['stop_lon']) + (weight_after * stop_after['stop_lon'])
                    
                    position = {'lat': position_lat, 'lon': position_lon}
                else:
                    position = None

                result.append({
                    "trip_id": trip_id,
                    "route_id": route_id,
                    "direction_id": direction_id,
                    "current_stop": current_stop,
                    "stop_after": stop_after,
                    "position": position
                })

    return {"active_trips": result}