import { useEffect, useState } from "react";
const useLocation = () => {
  const [start, setStart] = useState([0, 0]);
  useEffect(() => {
    let prev_start = [0, 0];

    let watch = setInterval(() => {
      navigator.geolocation.getCurrentPosition(showPosition, error);
    }, 1000);

    // let watch;
    // if (navigator.geolocation) {
    //   watch = navigator.geolocation.watchPosition(showPosition, error, {
    //     enableHighAccuracy: false,
    //   });
    //   console.log("watchid", watch);
    // } else {
    //   alert("Geolocation is not supported by this browser.");
    // }
    function error(err) {
      console.warn("ERROR(" + err.code + "): " + err.message);
    }
    function showPosition(position) {
      prev_start = [position.coords.longitude, position.coords.latitude];
      if (prev_start[0] != start[0] && prev_start[1] != start[1]) {
        setStart([position.coords.longitude, position.coords.latitude]);
      }
    }
    return () => clearInterval(watch);
    // return () => watch && navigator.geolocation.clearWatch(watch);
  }, [navigator.geolocation, start]);
  return start;
};
export default useLocation;
