import * as turf from "@turf/turf";
import { BBox } from "@turf/turf";
import { LngLatLike, Map as MapBox } from "mapbox-gl";
import { useEffect, useRef } from "react";
import Metro from "../datasets/metro.geojson";
import Montreal from "../datasets/montreal.geojson";
import Stations from "../datasets/stations.geojson";

interface IProps {
  width: string;
  height: string;
}

const MAP_CENTER = [-73.76336369482924, 45.47716384118107];
const MAP_BOUNDS = [
  -160.41387801962603, 66.62654588277326, -19.578607574651755,
  -3.818372752627269,
];
const DEFAULT_ZOOM = 10.816651549359792;

const Map: React.FC<IProps> = ({ width, height }) => {
  const mapContainer = useRef(null);
  const map = useRef<MapBox | null>(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new MapBox({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/standard",
      maxBounds: [
        [-73.92501255409634, 45.31122664381158],
        [-73.33552954479919, 45.874410582296235],
      ],
      center: MAP_CENTER as LngLatLike,
      pitch: 43.561849229250335,
      bearing: -19.200000000000045,
      zoom: DEFAULT_ZOOM,
      minZoom: DEFAULT_ZOOM,
      antialias: true,
    });

    map.current.on("load", function () {
      (map.current! as any).setConfigProperty(
        "basemap",
        "lightPreset",
        "night"
      );

      map.current!.addSource("mask", {
        type: "geojson",
        data: turf.mask(Montreal, turf.bboxPolygon(MAP_BOUNDS as BBox)),
      });

      map.current!.addLayer({
        id: "zmask",
        source: "mask",
        type: "fill",
        paint: {
          "fill-color": "white",
          "fill-opacity": 0.9,
        },
      });

      map.current!.addSource("stations", {
        type: "geojson",
        data: Stations,
      });

      map.current!.addLayer({
        id: "stations",
        source: "stations",
        type: "circle",
        paint: {
          "circle-radius": 5,
          "circle-color": "white",
          // @ts-ignore
          "circle-emissive-strength": 1,
        },
      });

      for (const feature of Metro.features) {
        if (
          !feature.properties.name ||
          !feature.properties.name.includes("Ligne")
        ) {
          return;
        }

        map.current!.addSource(feature.properties["@id"], {
          type: "geojson",
          data: feature,
        });

        map.current!.addLayer(
          {
            id: feature.properties["@id"],
            source: feature.properties["@id"],
            type: "line",
            paint: {
              "line-color": feature.properties.colour,
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                7.15,
                1.5,
                9.15,
                4,
                12,
                8,
                22,
                1.1,
              ],
              // @ts-ignore
              "line-emissive-strength": 1,
            },
          },
          "stations"
        );
      }
    });
  });

  return <div ref={mapContainer} style={{ width, height }} />;
};

export default Map;
