import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage.jsx';
import RoomPage from './components/RoomPage.jsx';
import RoleSelection from './components/RoleSelection.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import WatchTogetherLanding from './components/WatchTogetherLanding.jsx';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <ErrorBoundary>
          <Routes>
            <Route path="/join" element={<LandingPage />} />
            <Route 
              path="/room/:roomId/join" 
              element={<RoleSelection setCurrentUser={setCurrentUser} />} 
            />
            <Route 
              path="/room/:roomId" 
              element={<RoomPage currentUser={currentUser} />} 
            />
            <Route 
              path="/" 
              element={<WatchTogetherLanding />} 
            />
          </Routes>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;
