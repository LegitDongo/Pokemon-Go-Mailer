var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var gms = require('@google/maps').createClient({ key: 'Your API Key' });
var express = require('express');
var http = require('http');
var bodyParser = require("body-parser");
var request = require('request');
var fs = require('fs');
var pokemons = JSON.parse(fs.readFileSync('./static/data/pokemon.json', 'utf8'));
var wanted = [1,2,3,4,5,6,7,8,9,25,26,29,30,31,32,33,34,35,36,37,38,39,40,50,51, 56,57,58,59,62,63,64,65,66,67,68,73,74,75,76,77,78,80,81,82,83,86,87,88,89,90,91,92,93,94,95,96,97,100,101,104,105,106,107,108,109,110,111,112,113,115,122,124,125,126,129,130,131,132,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151];


var app = express();
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

var server = require('http').Server(app);
var port = process.env.PORT || 9876;

var username = 'you@gmail.com';
var password = 'password';
var sendTo = 'someoneelse@gmail.com'

server.listen(port, function (err) {
  console.log('Running server on port ' + port);
});

function aZ(i){ if (i < 10){ i = "0" + i; } return i; }

var latlong = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=';
var latlong2 = '&sensor=false';

// var registration_ids = fs.readFileSync('./regids.txt').toString().split("\n");

app.post('/', function(req, res) {
    //right now the IV deteminates are sent as null
    // console.log(req.body.message);
    if (wanted.indexOf(parseInt(req.body.message.pokemon_id)) >= 0){
        gms.reverseGeocode({ latlng: [req.body.message.latitude, req.body.message.longitude] }, function(err, response){
            if (!err){
                var name = pokemons[String(req.body.message.pokemon_id)]['name'];
                var disappearsAt = new Date(0);
                disappearsAt.setUTCSeconds(parseInt(req.body.message.disappear_time));
                var transporter = nodemailer.createTransport( smtpTransport({ 
                    service: 'gmail',
                    auth: {
                        user: username,
                        pass: password
                    },
                    tls: { rejectUnauthorized: false }
                } ));
                //'smtps://user%40gmail.com:pass@smtp.gmail.com'
                
                var options = {
                    from: '"Pokemon Go Maps" <' + username + '>',
                    to: sendto,
                    subject: name + ' ' + aZ(disappearsAt.getHours()) + ':' + aZ(disappearsAt.getMinutes()) + ':' + aZ(disappearsAt.getSeconds()),
                    text:
                        'Name: ' + name + '\n' +
                        'ID: ' + req.body.message.pokemon_id + '\n' +
                        'Disappear Time: ' + aZ(disappearsAt.getHours()) + ':' + aZ(disappearsAt.getMinutes()) + ':' + aZ(disappearsAt.getSeconds()) + '\n' +
                        'Relative Address: ' + response.json.results[0].formatted_address + '\n' +
                        'Maps URL: ' + 'http://maps.google.com/?q=' + req.body.message.latitude + ',' + req.body.message.longitude,
                    // html: '<b>Hello world ?</b>'
                };
                
                transporter.sendMail(options, function(error, info){
                    if (error){
                        return console.log(error);
                    }
                    else{
                        console.log('Sent: ' + name + '\t\t' + aZ(disappearsAt.getHours()) + ':' + aZ(disappearsAt.getMinutes()) + ':' + aZ(disappearsAt.getSeconds())); //+ info.response);
                    }
                });
             }
         });
    }
});