# pogomailer
A simple alert webhook module to use with the Pokemon go maps project.
For information about the Pokemon go maps project, see https://github.com/PokemonGoMap/PokemonGo-Map
This program works with NodeJS to send an email with essential information to inform you when there's an update to the map while "in the field"

Email format (Note the subject has the disappear time):

```
SUBJECT: Bulbasaur 15:15:15
Name: Bulbasaur
ID: 1
Disappear Time: 15:15:15
Relative Address: 123 South Missouri Ave.
Maps Url: http://maps.google.com/?g=123.123123123,123.234234234
```


The disappear time is in military time.

# Installation
In order to run this, you need NodeJS - https://nodejs.org/en/download/
This program requires nodemailer, nodemailer-smtp-transport, the javascript google maps api, express, http, body-parser, request, and fs modules in nodejs.

To install these, you can run
`npm install modulename modulename2`
in the command line when you are looking at the directory of the project.

According to https://github.com/googlemaps/google-maps-services-js you can get the javascript Google Maps API by using `npm install @google/maps` but I've never got that to work. So instead, I just use `npm install https://github.com/googlemaps/google-maps-services-js`

The email that is going to be sending emails probably needs to have the "Allow Less Secure Apps to Access" setting on.
Read more here: https://support.google.com/accounts/answer/6010255?hl=en

# Setup
You will have to add this app to the list of webhooks for your pokemon go maps instance. The config.ini file that you make with the Pokemon go maps installation has an option for webhook under Misc.
  An example of this (in the case of running on the same machine) would be `webhook: http://127.0.0.1:9876`
    You have to have the "http://" in front of the url.
    Remember to have the appropriate port here if it's set to something else than default.
    
The pogomailer.config.ini has to be in the same folder as the pogomailer.js program.

Copy pogomailer.config.example.ini to pogomailer.config.ini and change the following items

1. The "wantedlist" is a list of pokemon ID's (according to the global pokedex) that you want to have an email sent to you about.
  
2. Your username/password/send to email needs to be put into the username/password/sendto parts, respectively.

3. Put your own Google Maps API key into the APIkey section

Some optional settings

1. root - When this program is not in the root of the Pokemon Go Maps program, enter the path to the root of it.

2. port - When you don't want to run this server on port 9876, enter the port you wish to run on here. Warning! There is no check to see if that port is free.

# Run
To start this, navigate to this project's root in command line, and use `node pogomailer.js` to start it.

That's it.

# A few things to remember
Some sources say that Gmail has a maximum recepiant number of 500 per day.

# Notes
I've only tested this with Gmail accounts; they don't require a phone number like Yahoo does.

# Me
I'm a single developer that does this for fun. Requests will be responded to when I have free time.

I hope you find this useful.
