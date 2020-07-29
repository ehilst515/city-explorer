'use strict';

// Application Dependencies
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const superagent = require('superagent');

// Application Setup
const app = express();
const PORT = process.env.PORT;

// Route Definitions
app.get('/', rootHandler);
app.get('/location', locationHandler)
// app.get('/weather', weatherHandler)
app.use('*', notFoundHandler);
app.use(cors());
app.use(errorHandler);

// Route Handlers
function locationHandler(request, response) {
  const city = request.query.city;
  superagent.get(url)
    .query({
      key: YOUR_PRIVATE_TOKEN,
      q: city,
      format: 'json'
    })
    .then(locationIQResponse => {
      const topLocation = locationIQResponse.body[0];
      const myLocationResponse = new Location(city, topLocation);
      response.status(200).send(location);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

// function weatherHandler(request, response) {
//   const weatherResults = arrayOfForecasts.map(forecast => new Weather(forecast));
//   response.status(200).send(weatherResults);
// }

function rootHandler(request, response) {
  response.status(200).send('City Explorer App');
}

function notFoundHandler(request, response) {
  response.status(404).json({ notFound: true, message: 'That page does not exist.' });
}

function errorHandler(error, request, response, next) { // eslint-disable-line
  response.status(500).json({ error: true, message: error.message, });
}

// Constructors
function Location(city, locationData) {
  this.search_query = city;
  this.formatted_query = locationData[0].display_name;
  this.latitude = parseFloat(locationData[0].lat);
  this.longitude = parseFloat(locationData[0].lon);
}

function Weather(city, weatherData) {
  this.search_query = city;
  this.formatted_query = weatherData[0].city_name;
  this.latitude = parseFloat(weatherData[0].lat);
  this.longitude = parseFloat(weatherData[0].lon);
  this.forecast = weatherData[0].weather.description;
}

// App listener
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
