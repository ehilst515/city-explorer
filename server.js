'use strict';

// Application Dependencies
const express = require('express');
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT;


// Route Definitions
app.get('/', rootHandler);
app.get('/location', locationHandler)
app.use('*', notFoundHandler);
app.use(errorHandler);

// Route Handlers
function locationHandler(request, response) {
  const city = 'seattle';
  const locationData = require('./data/location.json');
  const location = new Location(city, locationData);
  response.status(200).send(location);
}

function rootHandler(request, response){
  response.status(200).send('City Explorer App')
}

function notFoundHandler(request, response) {
  response.status(404).json({ notFound: true });
}

function errorHandler(error, request, response, next) {
  response.status(500).json({ error: true, message: error.message });
}

// Constructors
function Location(city, locationData) {
  this.search_query = city;
  this.formatted_query = locationData[0].display_name;
  this.latitude = parseFloat(locationData[0].lat);
  this.longitude = parseFloat(locationData[0].lon);
}

// App listener
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
