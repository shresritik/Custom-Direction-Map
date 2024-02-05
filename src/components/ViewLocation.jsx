import axios from "axios";
import React, { useEffect, useState } from "react";

const API_ENDPOINT = `https://api.openweathermap.org/data/3.0/onecall?`;
const API_key = import.meta.env.VITE_WEATHER_TOKEN;

const ViewLocation = () => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => {
    console.log(API_ENDPOINT);
    navigator.geolocation.getCurrentPosition((position) => {
      console.log("hait");
      console.log(position.coords);
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
    });

    axios
      .get(
        `https://geocode.maps.co/search?q=address&lat=${latitude}&lon=${longitude}&api_key=${API_key}`
        // `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      )
      .then((response) => {
        console.log(response.data);
      });
  }, []);

  return (
    <div>
      <p>Latitude: {latitude}</p>
      <p>Longitude: {longitude}</p>
    </div>
  );
};

export default ViewLocation;
