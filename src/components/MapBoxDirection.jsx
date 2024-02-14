import React, { useState, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import useLocation from "../../hooks/useLocation";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MapboxDirections = () => {
  const [search, setSearch] = useState("");
  const [map, setMap] = useState(null);
  const [endCoords, setEndCoords] = useState({});
  const radius = 0.008;
  const start = useLocation();
  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${search}.json?proximity=${start}&access_token=${mapboxgl.accessToken}`,
        { method: "GET" }
      );
      const result = await res.json();
      const data = result.features[0].center;

      if (data) {
        // coords = Object.keys(event.lngLat).map((key) => event.lngLat[key]);
        const end = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Point",
                coordinates: data,
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
                      coordinates: data,
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
        getRoute(data);
      }
    } catch (error) {
      alert(error.message);
    }
  };
  var createGeoJSONCircle = function (center, radiusInKm, points) {
    if (!points) points = 64;

    var coords = {
      latitude: center[1],
      longitude: center[0],
    };

    var km = radiusInKm;

    var ret = [];
    var distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
    var distanceY = km / 110.574;

    var theta, x, y;
    for (var i = 0; i < points; i++) {
      theta = (i / points) * (2 * Math.PI);
      x = distanceX * Math.cos(theta);
      y = distanceY * Math.sin(theta);

      ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);

    return {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [ret],
            },
          },
        ],
      },
    };
  };
  const instructionFunc = (data) => {
    console.log(data);

    const instructions = document.getElementById("instructions");
    const steps = data.legs[0].steps;
    let tripInstructions = "";
    for (const step of steps) {
      let coord = step.geometry.coordinates[0];
      console.log("in instructionFunc", start, coord);
      const el = document.createElement("div");
      el.className = "landmark";
      new mapboxgl.Marker(el, { offset: [0, -50 / 2] })
        ?.setLngLat(coord)
        ?.setPopup(
          new mapboxgl.Popup({ offset: 25 }) // add popups
            .setHTML(`<h3>${coord[0]}</h3><p>${coord[1]}</p>`)
        )
        ?.addTo(map);
      console.log(
        (Math.abs(start[0] - coord[0]) < 0.0001 ||
          Math.abs(start[1] - coord[1]) < 0.0001) &&
          coord
      );
      if (
        Math.abs(start[0] - coord[0]) < 0.0001 &&
        Math.abs(start[1] - coord[1]) < 0.0001
      ) {
        // tripInstructions += `<li>${step.maneuver.instruction}</li>`;

        instructions.innerHTML = `<p><strong>Trip duration: ${Math.floor(
          step.duration / 60
        )} min 🚴 </strong></p><ol>${
          step.maneuver.instruction
        }</ol><br/><h3>start: ${
          start[0] + "," + start[1]
        }</h3><br/><h3>landmark:${coord[0] + "," + coord[1]}</h3>`;
        // break;
      }
    }
  };
  async function getRoute(end) {
    // make directions request using cycling profile
    const query = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?alternatives=true&annotations=duration%2Cdistance&geometries=geojson&language=en&overview=full&steps=true&voice_instructions=true&voice_units=imperial&access_token=${mapboxgl.accessToken}`,
      { method: "GET" }
    );
    if (!query.ok) {
      const json = await query.json();
      alert(json.message);
    } else {
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
        // get the sidebar and add the instructions
      }
      setEndCoords(data);
      // instructionFunc(data, start);
    }
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
    let marker, coords;
    if (map && start[0] > 0 && start[1] > 0) {
      map.setCenter(start);

      // make a marker for each feature and add it to the map

      console.log("start", start);

      map.on("click", (event) => {
        coords = Object.keys(event.lngLat).map((key) => event.lngLat[key]);
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
        getRoute(coords);
      });
      // map.on("render", () => {
      try {
        if (map?.getSource("polygon") || map?.getLayer("polygon")) {
          console.log("here");
          map
            .getSource("polygon")
            .setData(createGeoJSONCircle(start, radius).data);
        } else {
          map.addSource(
            "polygon",
            createGeoJSONCircle([start[0], start[1]], radius)
          );
          map.addLayer({
            id: "polygon",
            type: "fill",
            source: "polygon",
            layout: {},
            paint: {
              "fill-color": "blue",
              "fill-opacity": 0.6,
            },
          });
        }
        if (Object.keys(endCoords).length > 0) instructionFunc(endCoords);
        const el = document.createElement("div");
        el.className = "marker";
        marker = new mapboxgl.Marker(el, { offset: [0, -50 / 2] })
          ?.setLngLat(start)
          ?.setPopup(
            new mapboxgl.Popup({ offset: 25 }) // add popups
              .setHTML(`<h3>${start[0]}</h3><p>${start[1]}</p>`)
          )
          ?.addTo(map);
        console.log(
          new mapboxgl.Marker(el)
            .setLngLat(start)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }) // add popups
                .setHTML(`<h3>${start[0]}</h3><p>${start[1]}</p>`)
            )
            .addTo(map)
        );
        // });
      } catch (err) {
        console.log(err);
        window.location.reload();
      }
    }

    return () => marker?.remove();
  }, [map, start, endCoords]);

  return (
    <div className="flex flex-col  ">
      <div id="map" className="w-full h-full overflow-hidden"></div>
      <form onSubmit={handleSearch}>
        <input
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          className="absolute top-0 left-0 p-2 z-50"
          id="search"
          placeholder="Search location"
          value={search}
        />
      </form>

      <div id="instructions"></div>
    </div>
  );
};

export default MapboxDirections;
