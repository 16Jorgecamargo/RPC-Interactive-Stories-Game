import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;
const SERVER_URL = process.env.SERVER_URL || 'http://173.249.60.72:8443';

app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  res.send(`window.ENV = { SERVER_URL: '${SERVER_URL}' };`);
});

app.use('/src', express.static(path.join(__dirname, '../src')));

app.use(express.static(path.join(__dirname, '../public'), {
  extensions: ['html'],
  index: false
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Frontend server running at http://localhost:${PORT}`);
  console.log(`📡 Connecting to backend at ${SERVER_URL}`);
});
