import * as turf from "@turf/turf";
import { BBox } from "@turf/turf";
import { LngLatLike, Map as MapBox } from "mapbox-gl";
import { useContext, useEffect, useRef, useState } from "react";
// @ts-ignore
import { Threebox } from "threebox-plugin";
import Metro from "../datasets/metro.geojson";
import Montreal from "../datasets/montreal.geojson";
import Stations from "../datasets/stations.geojson";
import { LinesSettingsContext } from "../layout";

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
  const { linesSettings } = useContext(LinesSettingsContext);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [subwayCarts, setSubwayCarts] = useState(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new MapBox({
      container: mapContainer.current!,
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

    // @ts-ignore
    const tb = (window.tb = new Threebox(
      map.current,
      map.current.getCanvas().getContext("webgl"),
      {
        defaultLights: true,
      }
    ));

    map.current.on("style.load", function () {
      setMapLoaded(true);

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
          continue;
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

      for (const color of ["orange", "blue", "green", "yellow"]) {
        map.current!.addLayer({
          id: `tram-${color}`,
          type: "custom",
          renderingMode: "3d",
          onAdd: function () {
            const scale = 0.1;
            const options = {
              obj: "/models/train.gltf",
              type: "gltf",
              scale: { x: scale, y: scale, z: scale },
              units: "meters",
              rotation: { x: 90, y: -90, z: 0 },
            };

            tb.loadObj(options, (model: any) => {
              setSubwayCarts((subwayCarts) => ({
                // @ts-ignore
                ...subwayCarts,
                [color]: model,
              }));

              model.setCoords(MAP_CENTER);
              tb.add(model);
            });
          },
          render: function () {
            tb.update();
          },
        });
      }
    });
  });

  useEffect(() => {
    if (!mapLoaded) return;
    for (const [key, value] of Object.entries(linesSettings)) {
      for (const feature of Metro.features) {
        if (
          feature.properties["name:en"] &&
          feature.properties["name:en"].toLowerCase().includes(key)
        ) {
          map.current!.setLayoutProperty(
            feature.properties["@id"],
            "visibility",
            value ? "visible" : "none"
          );
        }
      }
    }
  }, [linesSettings, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !subwayCarts) return;

    setInterval(() => {
      for (const [key, value] of Object.entries(subwayCarts)) {
        const response = window.fetch('https://voltapi.mehdiben.me/api/metro/' + key + '/' + value + Date.now());
        response.then((res) => { 
          res.json().then((data) => {
          console.log(data['active_trips'][0]['position']['lat']);
          console.log("color", key);
          console.log("tram", value);
          (value as any).setCoords([data['active_trips'][0]['position']['lat'], data['active_trips'][0]['position']['lon']]);
          });
        });
    } 1000});
  }, [mapLoaded, subwayCarts]);

  return <div ref={mapContainer} style={{ width, height }} />;
};

export default Map;
