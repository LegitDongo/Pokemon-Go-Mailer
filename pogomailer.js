var fs = require('fs');
var config = fs.readFileSync('./pogomailer.config.ini', 'utf8').toString();
config = config.split(' ').join('');
config = config.replace(/\s*[#;].+$/gm, '');
config = config.split(/\r?\n/);
config.forEach(function(i,o,u){
    var is = i.split(':');
    u[o] = '"' + is[0] + '":"' + is[1] + '"'
    if (i.indexOf(',') >= 0){
        var items = i.split(':');
        u[o] = '"' + items[0] + '"' + ':[' + items[1] + ']';
    }
});
config = '{' + config.join(',') + '}';
try{
    config = JSON.parse(config);
}
catch(e){
    console.log('There was a problem converting the config file for use.');
    console.log(e);
    process.exit(1);
}
var root = config.root || './';
if (root.charAt(root.length - 1) != '/'){
    root += '/';
}

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var gms = require('@google/maps').createClient({ key: config.APIkey });
var express = require('express');
var http = require('http');
var bodyParser = require("body-parser");
var request = require('request');

var pokemons = JSON.parse(fs.readFileSync(root + 'static/data/pokemon.json', 'utf8'));

var app = express();
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

var server = require('http').Server(app);
var port = config.port || 9876;

server.listen(port, function (err) {
  console.log('Running server on port ' + port);
});

function aZ(i){ if (i < 10){ i = "0" + i; } return i; }

var latlong = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=';
var latlong2 = '&sensor=false';

// var registration_ids = fs.readFileSync('./regids.txt').toString().split("\n");

app.post('/', function(req, res) {
    // right now the IV deteminates are sent as null
    // console.log(req.body.message);
    if (config.wantedlist.length == 0 || config.wantedlist.indexOf(parseInt(req.body.message.pokemon_id)) >= 0){
        gms.reverseGeocode({ latlng: [req.body.message.latitude, req.body.message.longitude] }, function(err, response){
            if (!err){
                var name = pokemons[String(req.body.message.pokemon_id)]['name'];
                var disappearsAt = new Date(0);
                disappearsAt.setUTCSeconds(parseInt(req.body.message.disappear_time));
                var transporter = nodemailer.createTransport( smtpTransport({ 
                    service: 'gmail',
                    auth: {
                        user: config.username,
                        pass: config.password
                    },
                    tls: { rejectUnauthorized: false }
                } ));
                // 'smtps://user%40gmail.com:pass@smtp.gmail.com'
                
                var options = {
                    from: '"Pokemon Go Maps" <' + username + '>',
                    to: config.sendto,
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