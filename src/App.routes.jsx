import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import StoreInsights from './pages/StoreInsights';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/store-insights" element={<StoreInsights />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes; 