import React, { useEffect, useState } from 'react';
import { GoogleMap, Circle } from '@react-google-maps/api';
import "./App.css";
import cityData from './cityData.json';
import { useNavigate } from 'react-router-dom';

const containerStyle = {
  width: '100%',
  height: '100vh',
};

// Add mobile-specific map options
const mobileMapOptions = {
  gestureHandling: 'greedy', // Allows single finger pan/zoom on mobile
  zoomControl: false,        // Hide zoom controls
  streetViewControl: false,  // Hide street view control
  mapTypeControl: false,     // Hide map type control
  fullscreenControl: false   // Hide fullscreen control
};

const desktopMapOptions = {
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);
  const [mapRef, setMapRef] = useState(null);
  const navigate = useNavigate();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchCircles = async (endpoint) => {
    try {
      setFetchCounter((prev) => prev + 1);
      console.log(`fetchCircles called ${fetchCounter + 1} times`);

      const response = await fetch(`/api/${endpoint}/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZXZAZ21haWwuY29tIiwiaWF0IjoxNzM3OTkzMjQzLCJleHAiOjMzMjczOTkzMjQzfQ.qD9YPCEGkjnmtJ28NAzJK30mzJPC5leQO5Wc7QyqA2g`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Response not OK:', text);
        throw new Error(`Failed to fetch data: ${response.status}`);
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

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim() === '') {
      setFilteredCities([]);
      return;
    }

    const filtered = cityData.filter(city =>
      city.cityname.toLowerCase().replace(/"/g, '').includes(value.toLowerCase())
    ).slice(0, 5); // Limit to 5 suggestions
    
    setFilteredCities(filtered);
  };

  const handleCitySelect = (city) => {
    setSearchTerm(city.cityname.replace(/"/g, ''));
    setFilteredCities([]);
    
    // Center map on selected city
    if (mapRef) {
      mapRef.panTo({ lat: city.lat, lng: city.long });
      mapRef.setZoom(12);
    }
  };

  const onLoad = (map) => {
    setMapRef(map);
  };

  const handleStoreInsightsClick = () => {
    navigate('/store-insights');
  };

  return (
    <div className="relative">
      {/* Left Navigation Bar - Web Only */}
      <div className="hidden md:block absolute top-50 left-4 z-10 bg-white p-6 rounded-lg shadow-md w-80">
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

        <p className="text-gray-600 text-sm text-center mt-4">
          For Sales and Enterprise-grade solutions, contact{" "}
          <a href="mailto:yup1989@gmail.com" className="text-blue-600 underline">
            yup1989@gmail.com
          </a>
        </p>
      </div>

      {/* Mobile Navigation Panel */}
      <div className={`md:hidden fixed bottom-0 left-0 w-full bg-white p-6 rounded-t-lg shadow-md z-30 transform transition-transform duration-300 ${isNavOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        {/* Mobile Nav Content - Same as web but with close button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Consumer Map of India</h2>
          <button onClick={() => setIsNavOpen(false)} className="text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Rest of the mobile nav content - same as web version */}
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

        <p className="text-gray-600 text-sm text-center mt-4">
          For Sales and Enterprise-grade solutions, contact{" "}
          <a href="mailto:yup1989@gmail.com" className="text-blue-600 underline">
            yup1989@gmail.com
          </a>
        </p>
      </div>

      {/* Search and Store Insights - Centered */}
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-10 w-96">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search for a city..."
          className="w-full border rounded-lg p-2 bg-white shadow-md mb-2"
        />
        
        {filteredCities.length > 0 && (
          <div className="absolute w-full  bg-white border rounded-lg shadow-lg max-h-65 overflow-y-auto">
            {filteredCities.map((city, index) => (
              <button
                key={index}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => handleCitySelect(city)}
              >
                {city.cityname.replace(/"/g, '')}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            className="bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800"
            onClick={handleStoreInsightsClick}
          >
            Store Insights
          </button>
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden fixed bottom-4 right-4 z-40 bg-black text-white p-3 rounded-full shadow-lg"
        onClick={() => setIsNavOpen(true)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>

      {/* Updated Map Component */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onLoad={onLoad}
        options={isMobile ? mobileMapOptions : desktopMapOptions}
      >
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
    </div>
  );
};

export default App;
