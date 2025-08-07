import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  } 
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 4000;
const DATA_PATH = path.join(process.cwd(), 'links.json');

// Yardımcı fonksiyonlar
function readLinks() {
  if (!fs.existsSync(DATA_PATH)) return {};
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
}
function writeLinks(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// Link oluşturma
app.post('/api/create-link', (req, res) => {
  const { name } = req.body;
  const id = uuidv4();
  const links = readLinks();
  links[id] = { 
    id, 
    name: name || `Takip ${Object.keys(links).length + 1}`,
    createdAt: Date.now(), 
    lastLocation: null, 
    locations: [],
    isActive: false,
    lastSeen: null
  };
  writeLinks(links);
  res.json({ link: `/track/${id}`, id, name: links[id].name });
});

// Aktif linkleri listele
app.get('/api/links', (req, res) => {
  const links = readLinks();
  res.json(Object.values(links));
});

// Belirli bir takip linkinin konum geçmişini getir
app.get('/api/locations/:id', (req, res) => {
  const links = readLinks();
  const link = links[req.params.id];
  if (link) {
    res.json(link.locations || []);
  } else {
    res.status(404).json({ error: 'Link not found' });
  }
});

// Link silme
app.delete('/api/links/:id', (req, res) => {
  const links = readLinks();
  if (links[req.params.id]) {
    delete links[req.params.id];
    writeLinks(links);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Link not found' });
  }
});

// Link güncelleme (isim değiştirme)
app.put('/api/links/:id', (req, res) => {
  const { name } = req.body;
  const links = readLinks();
  if (links[req.params.id]) {
    links[req.params.id].name = name;
    writeLinks(links);
    res.json(links[req.params.id]);
  } else {
    res.status(404).json({ error: 'Link not found' });
  }
});

// Socket.io ile gerçek zamanlı konum takibi
io.on('connection', (socket) => {
  socket.on('join', (id) => {
    socket.join(id);
  });
  socket.on('location', ({ id, coords }) => {
    const links = readLinks();
    if (links[id]) {
      links[id].lastLocation = coords;
      links[id].isActive = true;
      links[id].lastSeen = Date.now();
      // Konum geçmişine ekle
      links[id].locations = links[id].locations || [];
      links[id].locations.push({ ...coords, timestamp: Date.now() });
      writeLinks(links);
      io.to(id).emit('location-update', coords);
      // Admin'e bildirim gönder
      socket.broadcast.emit('user-status-update', {
        id,
        name: links[id].name,
        isActive: true,
        lastSeen: links[id].lastSeen,
        coords
      });
    }
  });
  
  socket.on('disconnect', () => {
    // Kullanıcı bağlantısı kesildiğinde durumu güncelle
    // Bu kısım geliştirilecek
  });
});

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
