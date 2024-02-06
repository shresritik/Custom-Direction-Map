import React, { useState, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import useLocation from "../../hooks/useLocation";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MapboxDirections = () => {
  const [map, setMap] = useState(null);

  const start = useLocation();
  const instructionFunc = (data) => {
    console.log(data);
    const instructions = document.getElementById("instructions");
    const steps = data.legs[0].steps;
    let tripInstructions = "";
    for (const step of steps) {
      step.geometry.coordinates.forEach((coord) => {
        console.log(start[0] - coord[0]);
        if (
          Math.abs(start[0] - coord[0]) ||
          Math.abs(start[1] - coord[1]) < 0.0001
        ) {
          tripInstructions += `<li>${step.maneuver.instruction}</li>`;

          instructions.innerHTML = `<p><strong>Trip duration: ${Math.floor(
            data.duration / 60
          )} min 🚴 </strong></p><ol>${tripInstructions}</ol>`;
        }
      });
      break;
    }
  };
  async function getRoute(start, end) {
    // make directions request using cycling profile
    console.log(start, end);
    const query = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?alternatives=true&annotations=duration%2Cdistance&geometries=geojson&language=en&overview=full&steps=true&voice_instructions=true&voice_units=imperial&access_token=${mapboxgl.accessToken}`,
      { method: "GET" }
    );
    const json = await query.json();
    const data = json.routes[0];
    const route = data.geometry.coordinates;
    const geojson = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: route,
      },
    };
    // if the route already exists on the map, we'll reset it using setData
    if (map.getSource("route")) {
      map.getSource("route").setData(geojson);
    }
    // otherwise, we'll make a new request
    else {
      map.addLayer({
        id: "route",
        type: "line",
        source: {
          type: "geojson",
          data: geojson,
        },
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3887be",
          "line-width": 5,
          "line-opacity": 0.75,
        },
      });
    } // get the sidebar and add the instructions
    instructionFunc(data);
  }

  useEffect(() => {
    mapboxgl.accessToken = TOKEN;
    const newMap = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 0],
      zoom: 12,
    });
    setMap(newMap);
    return () => newMap.remove();
  }, []);

  useEffect(() => {
    let marker;
    if (map && start[0] > 0 && start[1] > 0) {
      map.setCenter(start);

      // make a marker for each feature and add it to the map

      console.log("start", start);

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
      const el = document.createElement("div");
      el.className = "marker";
      marker = new mapboxgl.Marker(el, { offset: [0, -50 / 2] })
        .setLngLat(start)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }) // add popups
            .setHTML(`<h3>${start[0]}</h3><p>${start[1]}</p>`)
        )
        .addTo(map);

      console.log(
        new mapboxgl.Marker(el)
          .setLngLat(start)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }) // add popups
              .setHTML(`<h3>${start[0]}</h3><p>${start[1]}</p>`)
          )
          .addTo(map)
      );
    }
    return () => marker?.remove();
  }, [map, start]);

  return (
    <div className="flex flex-col  ">
      <div id="map" className="w-full h-full overflow-hidden"></div>
      <div id="instructions" className="p-10"></div>
    </div>
  );
};

export default MapboxDirections;
