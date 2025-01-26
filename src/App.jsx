import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Circle } from '@react-google-maps/api';
import "./App.css";

const containerStyle = {
  width: '100%',
  height: '100vh',
};

const center = {
  lat: 19.076, // Centered near Mumbai
  lng: 72.8777,
};

const delay2sec = ()=>{
  return new Promise((resolve)=>{
    setTimeout(()=>{resolve()},2000);
  
  });
} 
const App = () => {
  const [circles, setCircles] = useState([]);
  const [foodRadius, setFoodRadius] = useState(100);
  const [foodColor, setFoodColor] = useState('#FF0000');
  const [lifestyleRadius, setLifestyleRadius] = useState(200);
  const [lifestyleColor, setLifestyleColor] = useState('#FFFF00');
  const [foodChecked, setFoodChecked] = useState(false);
  const [lifestyleChecked, setLifestyleChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchCounter, setFetchCounter] = useState(0);
  

  const fetchCircles = async (endpoint) => {
    try {
      setFetchCounter((prev) => prev + 1); // Increment counter each time the method is called
      console.log(`fetchCircles called ${fetchCounter + 1} times`);

      const response = await fetch(`http://65.0.179.91:9090/consumermapofindia/${endpoint}/all`, {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZXZAZ21haWwuY29tIiwiaWF0IjoxNzM3OTEyOTk1LCJleHAiOjMzMjczOTEyOTk1fQ.Fup6E4Pi9qIU46IBFlwtnGcnq8Z0mulUYKc5YHZybuM`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      return data.map((location) => ({ lat: location.latitude, lng: location.longitude }));
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  };

  const handleShowCircles = async () => {
    setLoading(true);

    console.log('Clearing all circles...');
    setCircles([]); // Clear existing circles

    let newCircles = [];

    if (foodChecked) {
      const foodData = await fetchCircles('food');
      console.log(" foodData - " +foodData.length);
  
      newCircles = [
        ...newCircles,
        ...foodData.map((circle) => ({ ...circle, type: 'food', color: foodColor, radius: foodRadius })),
      ];
      console.log("new Circles" + newCircles.length  + Array.isArray(newCircles));
    }

  
    if (lifestyleChecked) {
      console.log("Here afdasdf");
      const lifestyleData = await fetchCircles('lifestyle');
      newCircles = [
        ...newCircles,
        ...lifestyleData.map((circle) => ({ ...circle, type: 'lifestyle', color: lifestyleColor, radius: lifestyleRadius })),
      ];
    }

    console.log(`Adding ${newCircles.length} circles...`);
    setCircles(newCircles);
    await delay2sec();
    setLoading(false);
  };



  return (
    <div className="relative">
      {/* Left Navigation Bar */}
      <div className="absolute top-35 left-4 z-10 bg-white p-6 rounded-lg shadow-md w-80">
        <h2 className="text-xl font-semibold mb-6">Consumer Map of India</h2>
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="food-outlets"
              checked={foodChecked}
              onChange={(e) => setFoodChecked(e.target.checked)}
            />
            <label htmlFor="food-outlets" className="ml-2 text-lg">Food and Dining Outlets</label>
          </div>
          <div className="flex justify-between items-center mb-2">
            <label>Radius (in Meters):</label>
            <input
              type="number"
              value={foodRadius}
              onChange={(e) => setFoodRadius(Number(e.target.value))}
              className="border p-1 rounded w-20 text-right"
            />
          </div>
          <div className="flex justify-between items-center">
            <label>Color:</label>
            <input
              type="color"
              value={foodColor}
              onChange={(e) => setFoodColor(e.target.value)}
              className="w-10 h-8 border rounded"
            />
          </div>
        </div>

        {/* <div className="mb-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="lifestyle-outlets"
              checked={lifestyleChecked}
              onChange={(e) => setLifestyleChecked(e.target.checked)}
            />
            <label htmlFor="lifestyle-outlets" className="ml-2 text-lg">Lifestyle Outlets</label>
          </div>
          <div className="flex justify-between items-center mb-2">
            <label>Radius:</label>
            <input
              type="number"
              value={lifestyleRadius}
              onChange={(e) => setLifestyleRadius(Number(e.target.value))}
              className="border p-1 rounded w-20 text-right"
            />
          </div>
          <div className="flex justify-between items-center">
            <label>Color:</label>
            <input
              type="color"
              value={lifestyleColor}
              onChange={(e) => setLifestyleColor(e.target.value)}
              className="w-10 h-8 border rounded"
            />
          </div>
        </div> */}

        <button
          onClick={handleShowCircles}
          className="bg-black text-white py-2 px-4 rounded-lg w-full mt-4 flex items-center justify-center hover:bg-gray-800"
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin h-5 w-5 border-4 border-t-white border-black rounded-full"></div>
          ) : (
            "SHOW →"
          )}
        </button>
        {/* Contact Information */}
      <p className="text-gray-600 text-sm text-center mt-4">
        For Sales and Enterprise-grade solutions, contact{" "}
        <a href="mailto:yup1989@gmail.com" className="text-blue-600 underline">
          yup1989@gmail.com
        </a>
      </p>
      </div>

      

      {/* Search Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white p-2 rounded-lg shadow-md w-96">
        <input
          type="text"
          placeholder="City Search Bar Comming Soon ..."
          className="w-full border rounded-lg p-2"
        />
      </div>
       


     {/* Store Insights Button */}
     <div className="absolute top-4 right-4 z-20">
      <button
        className="bg-black text-white py-2 px-6 rounded-lg hover:bg-gray-800"
        onClick={() => console.log("Store Insights Clicked")}
      >
        Store Insights
      </button>
    </div>

      {/* Google Map */}
      <LoadScript googleMapsApiKey="AIzaSyAeLI09lwxkb-j_c5I4QEJJuOr-JPgQIw4">
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
          {circles.map((circle, index) => (
      
            <Circle
              key={index}
              center={circle}
              options={{
                strokeColor: circle.color,
                strokeOpacity: 0.0,
                fillColor: circle.color,
                fillOpacity: 0.35,
                radius: circle.radius,
              }}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default App;
