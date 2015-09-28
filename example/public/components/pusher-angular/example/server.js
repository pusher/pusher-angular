'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Pusher = require('pusher');

app.set('views', __dirname + '/app/views');
app.set('view engine', 'ejs');

var pusherConfig = {};
try {
  pusherConfig = require('./pusherConfig');
} catch (err) {
  pusherConfig.appId = 'YOUR_APP_ID';
  pusherConfig.key = 'YOUR_APP_KEY';
  pusherConfig.secret = 'YOUR_APP_SECRET';
}

var pusher = new Pusher(pusherConfig);
var port = Number(process.env.PORT || 3000);
var host = 'localhost';

app.use(bodyParser());
app.use(express.static(__dirname + '/public'));

app.post('/text-update', function(req, res) {
  pusher.trigger('presence-collaborate-' + req.body.channelNum, 'update', req.body.text, req.body.socket_id);
  res.send();
});

app.post('/pusher/auth', function(req, res) {
  var socketId = req.body.socket_id;
  var channel = req.body.channel_name;
  var auth = pusher.authenticate( socketId, channel, {
    user_id: "" + Math.floor(Math.random() * (1000 - 1) + 1),
    user_info: { username: req.body.username }
  });
  res.send( auth );
});

app.get('*', function(req, res){
  res.render('index');
});

app.listen(port);

console.log('Server running at http://'+host+':'+port.toString()+'/');