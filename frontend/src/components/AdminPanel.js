import React, { useState, useEffect } from 'react';
import L from 'leaflet';

function AdminPanel({ socket, setTrackId }) {
  const [links, setLinks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [newLinkName, setNewLinkName] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchLinks();
    // Kullanıcı durum güncellemelerini dinle
    socket.on('user-status-update', (data) => {
      setNotifications(prev => [...prev.slice(-4), {
        id: Date.now(),
        message: `${data.name} konumu güncellendi`,
        time: new Date().toLocaleTimeString()
      }]);
      fetchLinks(); // Linkleri yenile
    });
    return () => {
      socket.off('user-status-update');
    };
  }, []);

  const fetchLinks = () => {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
    fetch(`${BACKEND_URL}/api/links`)
      .then(res => res.json())
      .then(setLinks);
  };

  useEffect(() => {
    if (selected && !map) {
      const m = L.map('admin-map').setView([39.92, 32.85], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(m);
      setMap(m);
    }
    return () => { if (map) map.remove(); };
    // eslint-disable-next-line
  }, [selected]);

  useEffect(() => {
    if (selected && map) {
      socket.emit('join', selected.id);
      let polyline = null;
      // Geçmişi çek
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
      fetch(`${BACKEND_URL}/api/locations/${selected.id}`)
        .then(res => res.json())
        .then(locations => {
          if (locations.length > 0) {
            // Rota çiz
            const latlngs = locations.map(l => [l.latitude, l.longitude]);
            polyline = L.polyline(latlngs, { color: 'blue' }).addTo(map);
            // Marker'ı en son konuma koy
            const last = latlngs[latlngs.length - 1];
            if (marker) marker.setLatLng(last);
            else {
              const mk = L.marker(last, {
              icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })
            }).addTo(map);
              setMarker(mk);
            }
            map.fitBounds(polyline.getBounds());
          }
        });
      socket.on('location-update', coords => {
        if (marker) marker.setLatLng([coords.latitude, coords.longitude]);
        else {
          const mk = L.marker([coords.latitude, coords.longitude], {
            icon: L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })
          }).addTo(map);
          setMarker(mk);
        }
        map.setView([coords.latitude, coords.longitude], 15);
      });
      // Temizlik
      return () => {
        socket.off('location-update');
        if (polyline) map.removeLayer(polyline);
      };
    }
    // eslint-disable-next-line
  }, [selected, map]);

  const createLink = async () => {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
    const res = await fetch(`${BACKEND_URL}/api/create-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newLinkName })
    });
    const data = await res.json();
    fetchLinks();
    setNewLinkName('');
  };

  const deleteLink = async (id) => {
    if (confirm('Bu takip linkini silmek istediğinizden emin misiniz?')) {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
      await fetch(`${BACKEND_URL}/api/links/${id}`, {
        method: 'DELETE'
      });
      fetchLinks();
      if (selected && selected.id === id) {
        setSelected(null);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Link kopyalandı!');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Hiçbir zaman';
    return new Date(timestamp).toLocaleString('tr-TR');
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '\'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif',
      padding: 0
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '20px 30px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: 50, 
              height: 50, 
              background: 'linear-gradient(45deg, #667eea, #764ba2)', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 15,
              fontSize: 24
            }}>
              🗺️
            </div>
            <div>
              <h1 style={{ margin: 0, color: '#2c3e50', fontSize: 28, fontWeight: '700' }}>LocationTracker Pro</h1>
              <p style={{ margin: 0, color: '#7f8c8d', fontSize: 14 }}>Gelişmiş Konum Takip Yönetim Sistemi</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2c3e50' }}>{links.length}</div>
              <div style={{ fontSize: 12, color: '#7f8c8d' }}>Aktif Link</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#27ae60' }}>{links.filter(l => l.isActive).length}</div>
              <div style={{ fontSize: 12, color: '#7f8c8d' }}>Canlı Takip</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '30px' }}>
        {/* Bildirimler */}
        {notifications.length > 0 && (
          <div style={{ 
            marginBottom: 30, 
            padding: 20, 
            background: 'linear-gradient(45deg, #56ab2f, #a8e6cf)',
            borderRadius: 15,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            color: 'white'
          }}>
            <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 10, fontSize: 20 }}>🔔</span>
              Son Bildirimler
            </h4>
            {notifications.map(notif => (
              <div key={notif.id} style={{ 
                fontSize: 14, 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                padding: '8px 12px', 
                borderRadius: 8, 
                marginBottom: 5
              }}>
                <strong>{notif.time}</strong> - {notif.message}
              </div>
            ))}
          </div>
        )}
        
        {/* Yeni Link Oluşturma Kartı */}
        <div style={{ 
          marginBottom: 30, 
          padding: 25, 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 10, fontSize: 24 }}>➕</span>
            Yeni Takip Linki Oluştur
          </h3>
          <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🏷️ Link adı girin (opsiyonel)"
              value={newLinkName}
              onChange={(e) => setNewLinkName(e.target.value)}
              style={{ 
                padding: '12px 16px', 
                width: 300, 
                borderRadius: 12, 
                border: '2px solid #e1e8ed',
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'rgba(255,255,255,0.8)'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
            />
            <button 
              onClick={createLink}
              style={{ 
                padding: '12px 24px', 
                background: 'linear-gradient(45deg, #667eea, #764ba2)', 
                color: 'white', 
                border: 'none', 
                borderRadius: 12, 
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🚀 Oluştur
            </button>
          </div>
        </div>
        
        {/* Aktif Linkler */}
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 10, fontSize: 24 }}>🔗</span>
            Aktif Takip Linkleri ({links.length})
          </h3>
          {links.length === 0 ? (
            <div style={{
              padding: 40,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 20,
              textAlign: 'center',
              color: 'white'
            }}>
              <div style={{ fontSize: 48, marginBottom: 15 }}>📝</div>
              <p style={{ fontSize: 18, margin: 0 }}>Henüz hiç takip linki oluşturulmamış</p>
              <p style={{ fontSize: 14, margin: '5px 0 0 0', opacity: 0.8 }}>Yukarıdaki formdan yeni bir link oluşturabilirsiniz</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
              {links.map(l => (
                <div key={l.id} style={{ 
                  padding: 25, 
                  background: selected && selected.id === l.id 
                    ? 'linear-gradient(45deg, #667eea, #764ba2)' 
                    : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 20,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: 18, 
                          fontWeight: '600',
                          color: selected && selected.id === l.id ? 'white' : '#2c3e50'
                        }}>
                          {l.name || 'Adsız Link'}
                        </h4>
                        <div style={{
                          marginLeft: 10,
                          padding: '4px 8px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: '600',
                          background: l.isActive ? '#27ae60' : '#e74c3c',
                          color: 'white'
                        }}>
                          {l.isActive ? '🟢 Aktif' : '🔴 Pasif'}
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: 13, 
                        color: selected && selected.id === l.id ? 'rgba(255,255,255,0.8)' : '#7f8c8d',
                        lineHeight: 1.5
                      }}>
                        <div>🕰️ Son görülme: {formatTime(l.lastSeen)}</div>
                        <div>📅 Oluşturulma: {formatTime(l.createdAt)}</div>
                        <div>📍 Konum sayısı: {l.locations ? l.locations.length : 0}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => copyToClipboard(`http://localhost:3000/track/${l.id}`)}
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: 12, 
                        background: 'linear-gradient(45deg, #27ae60, #2ecc71)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 8, 
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      📋 Kopyala
                    </button>
                    <button 
                      onClick={() => setSelected(l)}
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: 12, 
                        background: 'linear-gradient(45deg, #3498db, #2980b9)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 8, 
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      🗺️ Haritada Gör
                    </button>
                    <button 
                      onClick={() => deleteLink(l.id)}
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: 12, 
                        background: 'linear-gradient(45deg, #e74c3c, #c0392b)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 8, 
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Harita */}
        {selected && (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 20,
            padding: 25,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <div style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 15,
                fontSize: 20
              }}>
                🗺️
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#2c3e50', fontSize: 22 }}>{selected.name} - Canlı Konum Takibi</h3>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: 14 }}>Geçmiş konumlar mavi rota ile, anlık konum kırmızı marker ile gösterilir</p>
              </div>
            </div>
            <div id="admin-map" style={{ 
              height: 600, 
              borderRadius: 15,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
