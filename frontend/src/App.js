import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import AdminPanel from './components/AdminPanel';
import TrackPage from './components/TrackPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
const socket = io(BACKEND_URL);

function App() {
  const [page, setPage] = useState('admin');
  const [trackId, setTrackId] = useState(null);

  useEffect(() => {
    // URL ile takip sayfası açılıyorsa
    const match = window.location.pathname.match(/track\/(.+)/);
    if (match) {
      setPage('track');
      setTrackId(match[1]);
    }
  }, []);

  if (page === 'admin') {
    return <AdminPanel socket={socket} setTrackId={setTrackId} />;
  }
  if (page === 'track' && trackId) {
    return <TrackPage socket={socket} trackId={trackId} />;
  }
  return null;
}

export default App;
