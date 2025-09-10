import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage.jsx';
import RoomPage from './components/RoomPage.jsx';
import RoleSelection from './components/RoleSelection.jsx';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/room/:roomId/join" 
            element={<RoleSelection setCurrentUser={setCurrentUser} />} 
          />
          <Route 
            path="/room/:roomId" 
            element={<RoomPage currentUser={currentUser} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;