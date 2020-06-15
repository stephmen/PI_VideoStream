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

app.post('/receive', function (req, res) {
  console.log("The Image Was Triggered")
  var body = '';
  var filePath = __dirname + '/Images/canvas.jpg';
  console.log(filePath)
  req.on('data', function (data) {
    body += data;
  });
  // When whole image uploaded complete.
  req.on('end', function () {
    // Get rid of the image header as we only need the data parts after it.
    var data = body.replace(/^data:image\/\w+;base64,/, "");
    // Create a buffer and set its encoding to base64
    var buf = new Buffer(data, 'base64');
    // Write
    fs.writeFile(filePath, buf, function (err) {
      if (err) throw err
      // Respond to client that the canvas image is saved.
      var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
      var visualRecognition = new VisualRecognitionV3({
        version: '2018-03-19',
        iam_apikey: '8-Rj9GT4s1zsvI3LDGvvKtuRulW86EmU2eSArET5QTRf'
      });
      var images_file = fs.createReadStream('./Images/canvas.jpg');
      var params = {
        images_file: images_file,
      };
      visualRecognition.classify(params, function (err, response) {
        if (err) {
          console.log(err);
        } else {
          console.log(JSON.stringify(response, null, 2))
        }
        res.send(JSON.stringify(response, null, 2));
      });
    });
  });
});
//////////////////////////////////////////////////////////
/////////////////END///////////////////////////////////////
app.use((err, req, res, next) => {
  console.error(err);
  next(err);
});

app.listen(8181, () => console.log('Server started on 8181'));
