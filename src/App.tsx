import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import FormPage from './pages/FormPage';
import DashboardPage from './pages/DashboardPage';
import ConfigurationPage from './pages/ConfigurationPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<FormPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="config" element={<ConfigurationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
