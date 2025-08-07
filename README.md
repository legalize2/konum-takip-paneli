# Konum Takip Paneli

Bu proje, admin panelinden oluşturulan linkler aracılığıyla kullanıcıların gerçek zamanlı konumunu harita üzerinde takip etmeyi sağlar.

## Özellikler
- Admin panelinden tekil takip linki oluşturma
- Kullanıcıdan konum izni isteme ve gerçek zamanlı konum paylaşımı
- Harita üzerinde canlı takip (Leaflet.js)
- Basit ve işlevsel arayüz

## Kullanılan Teknolojiler
- React.js (frontend)
- Node.js + Express.js + Socket.io (backend)
- Leaflet.js + OpenStreetMap (harita)

## Kurulum
1. `backend` ve `frontend` klasörlerine girip bağımlılıkları yükleyin:
   ```sh
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Önce backend'i, ardından frontend'i başlatın.

## Notlar
- İlk sürümde tüm veriler dosya tabanlı (JSON) olarak saklanır.
- Gizlilik ve güvenlik için linkler benzersizdir.
