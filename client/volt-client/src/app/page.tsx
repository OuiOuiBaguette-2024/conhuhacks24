"use client";
import { Cog8ToothIcon } from "@heroicons/react/24/solid";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Clock from "./components/Clock";
import IconButton from "./components/IconButton";
import Map from "./components/Map";
import Sidebar from "./components/Sidebar";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZHJha290YSIsImEiOiJjamducml0cTAyMTR0MzNxdTgxbTgzN2JyIn0.Ck9PVGcSXx5VyGfqi3NbGA";

export default function Home() {
  return (
    <>
      <div className="absolute left-0 top-0 z-10 p-5">
        <Clock />
      </div>
      <Map width="100vw" height="100vh" />
      <Sidebar />
    </>
  );
}
