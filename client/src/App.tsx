import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Files from './pages/Files';
import Sessions from './pages/Sessions';
import Memory from './pages/Memory';
import Cron from './pages/Cron';
import SubAgents from './pages/SubAgents';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="memory" element={<Memory />} />
          <Route path="cron" element={<Cron />} />
          <Route path="subagents" element={<SubAgents />} />
          <Route path="files" element={<Files />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
