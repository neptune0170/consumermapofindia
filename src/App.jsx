import React, { useEffect, useState } from 'react';
import { GoogleMap, Circle, OverlayView, Rectangle } from '@react-google-maps/api';
import "./App.css";
import cityData from './cityData.json';
import { useNavigate } from 'react-router-dom';

const containerStyle = {
  width: '100%',
  height: '100vh',
};

// Modify the map options to be simpler
const mobileMapOptions = {
  gestureHandling: 'greedy',
  zoomControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  minZoom: 11,
  maxZoom: 20
};

const desktopMapOptions = {
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
  minZoom: 11,
  maxZoom: 20
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

const GRID_SIZE_DEGREES = 0.009; // approximately 1km at equator

const METERS_PER_PIXEL_AT_ZOOM_LEVEL_1 = 78271.484;

const createGridForBounds = (bounds, zoom) => {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  
  // Snap to grid
  const startLat = Math.floor(sw.lat() / GRID_SIZE_DEGREES) * GRID_SIZE_DEGREES;
  const endLat = Math.ceil(ne.lat() / GRID_SIZE_DEGREES) * GRID_SIZE_DEGREES;
  const startLng = Math.floor(sw.lng() / GRID_SIZE_DEGREES) * GRID_SIZE_DEGREES;
  const endLng = Math.ceil(ne.lng() / GRID_SIZE_DEGREES) * GRID_SIZE_DEGREES;

  const grid = [];

  for (let lat = startLat; lat <= endLat; lat += GRID_SIZE_DEGREES) {
    for (let lng = startLng; lng <= endLng; lng += GRID_SIZE_DEGREES) {
      grid.push({
        bounds: {
          north: lat + GRID_SIZE_DEGREES,
          south: lat,
          east: lng + GRID_SIZE_DEGREES,
          west: lng
        },
        center: { 
          lat: lat + (GRID_SIZE_DEGREES/2), 
          lng: lng + (GRID_SIZE_DEGREES/2) 
        },
        key: `${lat.toFixed(6)},${lng.toFixed(6)}`
      });
    }
  }

  return grid;
};

const countStoresInCell = (bounds, stores) => {
  return stores.filter(store => 
    store.lat >= bounds.south &&
    store.lat <= bounds.north &&
    store.lng >= bounds.west &&
    store.lng <= bounds.east
  ).length;
};

// Add these constants for color scaling
const COLOR_SCALES = {
  food: [
    { threshold: 0, color: 'rgba(255, 0, 0, 0.1)' },
    { threshold: 5, color: 'rgba(255, 0, 0, 0.3)' },
    { threshold: 10, color: 'rgba(255, 0, 0, 0.5)' },
    { threshold: 20, color: 'rgba(255, 0, 0, 0.7)' }
  ],
  lifestyle: [
    { threshold: 0, color: 'rgba(0, 0, 255, 0.1)' },
    { threshold: 5, color: 'rgba(0, 0, 255, 0.3)' },
    { threshold: 10, color: 'rgba(0, 0, 255, 0.5)' },
    { threshold: 20, color: 'rgba(0, 0, 255, 0.7)' }
  ]
};

const getColorForCount = (count, type) => {
  const scale = COLOR_SCALES[type];
  for (let i = scale.length - 1; i >= 0; i--) {
    if (count >= scale[i].threshold) return scale[i].color;
  }
  return scale[0].color;
};

// Custom Grid Cell component
const GridCell = ({ bounds, storeCount, onClick }) => {
  const getColor = (count) => {
    if (count === 0) return 'rgba(200, 200, 200, 0.1)';
    if (count < 5) return 'rgba(255, 0, 0, 0.2)';
    if (count < 10) return 'rgba(255, 0, 0, 0.4)';
    if (count < 20) return 'rgba(255, 0, 0, 0.6)';
    return 'rgba(255, 0, 0, 0.8)';
  };

  return (
    <Rectangle
      bounds={bounds}
      options={{
        fillColor: getColor(storeCount),
        fillOpacity: 1,
        strokeColor: '#666',
        strokeWeight: 1,
        strokeOpacity: 0.5,
        clickable: true
      }}
      onClick={onClick}
    >
      {storeCount > 0 && (
        <OverlayView
          position={{ 
            lat: bounds.south + (bounds.north - bounds.south) / 2,
            lng: bounds.west + (bounds.east - bounds.west) / 2
          }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div className="bg-white px-2 py-1 rounded shadow text-sm">
            {storeCount} stores
          </div>
        </OverlayView>
      )}
    </Rectangle>
  );
};

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
  const [selectedCell, setSelectedCell] = useState(null);
  const [gridCells, setGridCells] = useState([]);
  const [stores, setStores] = useState([]);
  const [isGridEnabled, setIsGridEnabled] = useState(false);
  const [shouldShowGrid, setShouldShowGrid] = useState(false);
  

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
      return data.map((location) => ({ 
        lat: location.latitude, 
        lng: location.longitude 
      }));
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  };

  const handleShowCircles = async () => {
    setLoading(true);
    let allStores = [];

    // Update actual grid visibility based on preference when showing
    setIsGridEnabled(shouldShowGrid);

    if (foodChecked) {
      const foodData = await fetchCircles('food');
      allStores = [...allStores, ...foodData.map(store => ({
        ...store,
        type: 'food',
        color: foodColor,
        radius: foodRadius
      }))];
    }

    if (lifestyleChecked) {
      const lifestyleData = await fetchCircles('lifestyle');
      allStores = [...allStores, ...lifestyleData.map(store => ({
        ...store,
        type: 'lifestyle',
        color: lifestyleColor,
        radius: lifestyleRadius
      }))];
    }

    setStores(allStores);
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

  // Add click handler for grid cells
  const handleCellClick = (cell) => {
    setSelectedCell(cell);
    // You can add more detailed view logic here
    console.log(`Selected cell with ${cell.storeCount} stores`);
    // TODO: Show detailed information in a modal or side panel
  };

  // Update grid when map bounds change
  const handleBoundsChanged = () => {
    if (!mapRef) return;
    
    const bounds = mapRef.getBounds();
    const grid = createGridForBounds(bounds, 11);
    
    // Calculate store counts for each cell
    const cellsWithCounts = grid.map(cell => ({
      ...cell,
      storeCount: countStoresInCell(cell.bounds, stores)
    }));

    setGridCells(cellsWithCounts);
  };

  // Update grid when stores change
  useEffect(() => {
    if (mapRef && stores.length > 0) {
      handleBoundsChanged();
    }
  }, [stores]);

  return (
    <div className="relative">
      {/* Left Navigation Bar - Web Only */}
      <div className="hidden md:block absolute top-50 left-4 z-10 bg-white p-6 rounded-lg shadow-md w-80">
        <h2 className="text-xl font-semibold mb-6">Consumer Map of India</h2>
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="grid-toggle"
              checked={shouldShowGrid}
              onChange={(e) => setShouldShowGrid(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="grid-toggle" className="text-lg">Enable Grid View</label>
          </div>

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
              id="grid-toggle"
              checked={shouldShowGrid}
              onChange={(e) => setShouldShowGrid(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="grid-toggle" className="text-lg">Enable Grid View</label>
          </div>

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
        zoom={11}
        onLoad={onLoad}
        onBoundsChanged={handleBoundsChanged}
        options={isMobile ? mobileMapOptions : desktopMapOptions}
      >
        {isGridEnabled ? (
          // Render grid cells when grid is enabled
          gridCells.map((cell) => (
            <GridCell
              key={cell.key}
              bounds={cell.bounds}
              storeCount={cell.storeCount}
              onClick={() => handleCellClick(cell)}
            />
          ))
        ) : (
          // Render circles when grid is disabled
          stores.map((store, index) => (
            <Circle
              key={index}
              center={{ lat: store.lat, lng: store.lng }}
              options={{
                strokeColor: store.color,
                strokeOpacity: 0.0,
                fillColor: store.color,
                fillOpacity: 0.35,
                radius: store.radius,
              }}
            />
          ))
        )}
      </GoogleMap>

      {/* Updated detail panel */}
      {selectedCell && (
        <div className="absolute top-20 right-4 bg-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Grid Cell Details</h3>
            <button onClick={() => setSelectedCell(null)}>×</button>
          </div>
          <p>{selectedCell.storeCount} stores in this area</p>
        </div>
      )}
    </div>
  );
};

export default App;
