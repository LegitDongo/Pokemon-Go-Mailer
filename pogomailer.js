var fs = require('fs');
// Get the config file, convert to string, split into array by spaces, put back into string with no spaces, remove all parts with a "#" to the end of the line, put into array by new line
var config = fs.readFileSync('./pogomailer.config.ini', 'utf8').toString().split(' ').join('').replace(/\s*[#;].+$/gm, '').split(/\r?\n/);
// every place that has a ":", check to see if there is a comma in the string, if there is, put array markers around it, otherwise, leave alone
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

function forceQuit(req){
    console.log('You are missing the required config items! - ' + req + ' - Force quitting.');
    process.exit(1);
}

//required config items
config.APIkey || forceQuit('APIkey');
config.username || forceQuit('username');
config.password || forceQuit('password');
config.sendto || forceQuit('sendto');

if (config.movesets){
    config.defense = config.movesets.includes("defense");
    config.offense = config.movesets.includes("offense");
}

//checks to see if the number is in the Pokemon wanted list
function inList(pokeid){
    return config.wantedlist.indexOf(parseInt(pokeid)) >= 0
}

//returns the rounded percentage of the IV percentage
function IVCalc(id, ia, is){
    return Math.round((id + ia + is) / 45 * 100);
}

//returns true if meets parameters for IVs in config file
function checkIV(pokemon){
    if (pokemon.individual_defense && pokemon.individual_attack && pokemon.individual_stamina && typeof config.minivpercentage !== 'undefined' && config.minivpercentage > 0){
        if ((config.ivpercentagewanted === true && inList(pokemon.pokemon_id)) || config.ivpercentagewanted === false || typeof config.ivpercentagewanted === 'undefined'){
            if (config.minivpercentage <= IVCalc(pokemon.individual_defense, pokemon.individual_attack, pokemon.individual_stamina)){
                return true;
            }
        }
    }
    return false;
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

try{
    var pokemons = JSON.parse(fs.readFileSync(root + 'static/data/pokemon.json', 'utf8'));
    var moves = JSON.parse(fs.readFileSync(root + 'static/data/moves.json', 'utf8'));
}
catch (e){
    console.log('Error in parsing or finding config file --' + e);
    process.exit(1);
}

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
var ivpath = '/en/tools/iv-calculator';

app.post('/', function(req, res) {
    if (config.wantedlist.length === 0 || inList(req.body.message.pokemon_id) || checkIV(req.body.message)){
        gms.reverseGeocode({ latlng: [req.body.message.latitude, req.body.message.longitude] }, function(err, response){
            if (!err){
                
                try{ var name = pokemons[String(req.body.message.pokemon_id)]['name']; }
                catch(e){
                    console.log('Error in getting Pokemon, try updating PokemonGo-Maps');
                    var name = req.body.message.pokemon_id;
                }
                
                try{ var move1 = moves[String(req.body.message.move_1)]['name']; }
                catch (e){
                    console.log('Error in getting move 1, try updating PokemonGo-Maps');
                    var move1 = req.body.message.move_1;
                }
                
                try{ var move2 = moves[String(req.body.message.move_2)]['name']; }
                catch(e){
                    console.log('Error in getting move 2, try updating PokemonGo-Maps');
                    var move2 = req.body.message.move_2;
                }
                
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
                
                
                var options = {
                    from: '"Pokemon Go Maps" <' + config.username + '>',
                    to: config.sendto,
                    subject: name + ' ' + aZ(disappearsAt.getHours()) + ':' + aZ(disappearsAt.getMinutes()) + ':' + aZ(disappearsAt.getSeconds()),
                    text:
                        'Name: ' + name + ' - ' + req.body.message.pokemon_id + '\n' +
                        'Disappear Time: ' + aZ(disappearsAt.getHours()) + ':' + aZ(disappearsAt.getMinutes()) + ':' + aZ(disappearsAt.getSeconds()) + '\n' +
                        'IVs: ' + IVCalc(req.body.message.individual_defense, req.body.message.individual_attack, req.body.message.individual_stamina) + '%\n' +
                        'Moveset: ' + move1 + ', ' + move2 + '\n' +
                        'Relative Address: ' + response.json.results[0].formatted_address + '\n' +
                        'Maps URL: ' + 'http://maps.google.com/?q=' + req.body.message.latitude + ',' + req.body.message.longitude,
                };
                transporter.sendMail(options, function(error, info){
                    if (!error){
                        console.log('Sent: ' + name + '\t\t\t' + IVCalc(req.body.message.individual_defense, req.body.message.individual_attack, req.body.message.individual_stamina) + '% - ' + aZ(disappearsAt.getHours()) + ':' + aZ(disappearsAt.getMinutes()) + ':' + aZ(disappearsAt.getSeconds()));
                    }
                    else{
                        console.log(error);
                    }
                });
             }
             else{
                 console.log(err + ' - ' + response);
             }
         });
    }
});