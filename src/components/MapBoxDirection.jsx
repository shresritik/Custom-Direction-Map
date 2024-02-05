import React, { useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MapboxDirections = () => {
  const [map, setMap] = useState(null);
  const [start, setStart] = useState([0, 0]);
  const [prevStart, setPrevStart] = useState([0, 0]);
  const [locationName, setLocationName] = useState("");

  const getPosition = (position) => {
    const { latitude, longitude, accuracy } = position.coords;
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);
    console.log("Accuracy:", accuracy);

    setStart([longitude, latitude]);
    fetchLocationName([longitude, latitude]);
  };

  const fetchLocationName = async (coordinates) => {
    const [lng, lat] = coordinates;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${TOKEN}`
      );
      const data = await response.json();
        console.log(data)
      if (data.features && data.features.length > 0) {
        const name = data.features[0].place_name;
        setLocationName(name);
      }
    } catch (err) {
      console.error("Error fetching location name:", err);
    }
  };
  console.log(locationName, "ddd");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(getPosition);
  }, []);

  console.log(start[0], start[1]);

  useEffect(() => {
    if (map) {
      map.on("load", () => {
        map.addLayer({
          id: "point",
          type: "circle",
          source: {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "Point",
                    coordinates: start,
                  },
                },
              ],
            },
          },
          paint: {
            "circle-radius": 10,
            "circle-color": "#3887be",
          },
        });

        map.on("click", (event) => {
          const coords = Object.keys(event.lngLat).map(
            (key) => event.lngLat[key]
          );
          const end = {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "Point",
                  coordinates: coords,
                },
              },
            ],
          };

          if (map.getLayer("end")) {
            map.getSource("end").setData(end);
          } else {
            map.addLayer({
              id: "end",
              type: "circle",
              source: {
                type: "geojson",
                data: {
                  type: "FeatureCollection",
                  features: [
                    {
                      type: "Feature",
                      properties: {},
                      geometry: {
                        type: "Point",
                        coordinates: coords,
                      },
                    },
                  ],
                },
              },
              paint: {
                "circle-radius": 10,
                "circle-color": "#f30",
              },
            });
          }

          getRoute(start, coords);
        });
      });
    }
  }, [map, start]);

  useEffect(() => {
    mapboxgl.accessToken = TOKEN;
    const newMap = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: [85.2775613, 27.6695577],
      zoom: 12,
    });
    setMap(newMap);

    return () => {
      newMap.remove();
    };
  }, []);
  const getRoute = async (start, end) => {
    setPrevStart([start[0], start[1]]);
  };

  return (
    <div className="flex flex-col items-center ">
      <div id="map" className="w-full h-[70vh]"></div>
      <div id="instructions" className="p-10">
        <div>
          <b>Longitude:</b> {start[0]} <b>Lattitude:</b> {start[1]}
        </div>
        <div>
          <b>Your current location is:</b> {locationName}
        </div>
      </div>
    </div>
  );
};

export default MapboxDirections;
