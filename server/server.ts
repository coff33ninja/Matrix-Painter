
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { SerialPort } from 'serialport';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3001;

app.get('/api/serial-ports', async (req, res) => {
  try {
    const ports = await SerialPort.list();
    res.json(ports);
  } catch (error) {
    console.error('Error listing serial ports:', error);
    res.status(500).json({ message: 'Error listing serial ports' });
  }
});

wss.on('connection', (ws) => {
  console.log('Client connected');
  let port: SerialPort | null = null;

  ws.on('message', async (message) => {
    const data = JSON.parse(message.toString());

    switch (data.type) {
      case 'CONNECT':
        if (port) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Already connected' }));
          return;
        }
        try {
          port = new SerialPort({ path: data.path, baudRate: data.baudRate });
          port.on('open', () => {
            ws.send(JSON.stringify({ type: 'STATUS', message: 'connected' }));
          });
          port.on('close', () => {
            ws.send(JSON.stringify({ type: 'STATUS', message: 'disconnected' }));
            port = null;
          });
          port.on('error', (err) => {
            ws.send(JSON.stringify({ type: 'ERROR', message: err.message }));
          });
        } catch (error: any) {
            ws.send(JSON.stringify({ type: 'ERROR', message: error.message }));
        }
        break;

      case 'DISCONNECT':
        if (port) {
          port.close();
        }
        break;

      case 'SEND':
        if (port && port.isOpen) {
          port.write(data.payload);
        }
        break;
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (port) {
      port.close();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
