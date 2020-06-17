const express = require('express');
const fs = require('fs');
const app = express();
const ws = require('express-ws')(app);
const path = require('path');
const raspividStream = require('raspivid-stream');
const spawn = require('child_process').spawn;
const cors = require('cors');





app.use(express.static('dist'))
app.get('/', (req, res) => res.sendFile(`${__dirname}/index.html`));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.options('*', cors());

app.ws('/video-stream', (ws, req) => {
  console.log('Client connected');
  ws.send(JSON.stringify({
    action: 'init',
    width: '640',
    height: '480',
  }));

  const videoStream = raspividStream({
    width: 640,
    height: 480,
    rotation: 180
  });

  videoStream.on('data', (data) => {
    ws.send(data, {
      binary: true
    }, (error) => {
      if (error) console.error(error);
    });
  });

  ws.on('close', () => {
    console.log('Client left');
    videoStream.removeAllListeners('data');
  });
});


app.use((err, req, res, next) => {
  console.error(err);
  next(err);
});

app.listen(8181, () => console.log('Server started on 8181'));
