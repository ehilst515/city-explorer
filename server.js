'use strict';

// Application Dependencies
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const superagent = require('superagent');

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// Route Definitions
app.get('/', rootHandler);
app.get('/location', locationHandler);
app.get('/yelp', restaurantHandler);
// app.get('/weather', weatherHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

// Route Handlers
function locationHandler(request, response) {
  const city = request.query.city;
  const url = 'https://us1.locationiq.com/v1/search.php';
  superagent.get(url)
    .query({
      key: process.env.LOCATION_KEY,
      q: city,
      format: 'json'
    })
    .then(locationIQResponse => {
      const topLocation = locationIQResponse.body[0];
      const myLocationResponse = new Location(city, topLocation);
      response.status(200).send(myLocationResponse);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}
function restaurantHandler(request, response) {
  const key = process.env.YELP_KEY
  const lat = parseFloat(request.query.latitude);
  const lon = parseFloat(request.query.longitude);
  const currentPage = request.query.page;
  const numPerPage = 4;
  const start = ((currentPage - 1) * numPerPage + 1);
  const url = 'https://api.yelp.com/v3/businesses/search';
  superagent.get(url)
    .query({
      latitude: lat,
      longitude: lon,
      limit: numPerPage,
      offset: start
    })
    .set('Authorization', `Bearer ${key}`)
    .then(yelpResponse => {
      console.log(yelpResponse);
      const arrayOfRestaurants = yelpResponse.body.businesses;
      const restaurantsResults = [];
      arrayOfRestaurants.forEach(restaurantObj => {
        restaurantsResults.push(new Restaurant(restaurantObj));
      });
      response.send(restaurantsResults);
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
  response.status(500).json({ error: true, message: error.message });
}

// Constructors
function Location(city, locationData) {
  this.search_query = city;
  this.formatted_query = locationData.display_name;
  this.latitude = parseFloat(locationData.lat);
  this.longitude = parseFloat(locationData.lon);
}

function Weather(city, weatherData) {
  this.search_query = city;
  this.formatted_query = location.display_name;
  this.latitude = parseFloat(weatherData[0].lat);
  this.longitude = parseFloat(weatherData[0].lon);
}

function Restaurant(obj) {
  this.name = obj.name;
  this.url = obj.url;
  this.rating = obj.rating;
  this.price = obj.price;
  this.image_url = obj.image_url;
}

// App listener
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
