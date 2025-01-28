import { LoadScript } from '@react-google-maps/api';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from '../App';
import StoreInsights from '../pages/StoreInsights';

const MapWrapper = () => {
  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/store-insights" element={<StoreInsights />} />
        </Routes>
      </BrowserRouter>
    </LoadScript>
  );
};

export default MapWrapper; 