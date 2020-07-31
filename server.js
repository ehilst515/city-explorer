'use strict';

// Application Dependencies
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const PORT = process.env.PORT;

// Application Setup
const app = express();

// const DATABASE = process.env.DATABASE_URL;
app.use(cors());
if (!process.env.DATABASE_URL) {
  throw new Error('Missing database URL.');
}
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => { throw err; });

// Route Definitions
app.get('/', rootHandler);
app.get('/location', locationHandler);
app.get('/yelp', restaurantHandler);
app.get('/weather', weatherHandler);
app.get('/movies', movieHandler);
app.get('/trails', trailHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

// Route Handlers
function locationHandler(request, response) {
  const city = request.query.city.toLowerCase().trim();
  getLocationData(city)
    .then(locationData => {
      response.status(200).send(locationData);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

function getLocationData(city) {
  const SQL = 'SELECT * FROM locations WHERE search_query = $1';
  const values = [city];
  return client.query(SQL, values)
    .then((results) => {
      if (results.rowCount > 0) {
        return results.rows[0];
      } else {
        const url = 'https://us1.locationiq.com/v1/search.php';
        return superagent.get(url)
          .query({
            key: process.env.LOCATION_KEY,
            q: city,
            format: 'json'
          })
          .then((data) => {
            console.log(data);
            return setLocationData(city, data.body[0]);
          });
      }
    });
}

function setLocationData(city, locationData) {
  const location = new Location(city, locationData);
  const SQL = `
    INSERT INTO locations (search_query, formatted_query, latitude, longitude)
    VALUES ($1, $2, $3, $4);
    `;
  const values = [city, location.formatted_query, location.latitude, location.longitude];
  return client.query(SQL, values)
    .then(results => {
      return results.rows[0]
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

function weatherHandler(request, response) {
  const url = 'https://api.weatherbit.io/v2.0/forecast/daily';
  const lat = parseFloat(request.query.latitude);
  const lon = parseFloat(request.query.longitude);
  superagent.get(url)
    .query({
      key: process.env.WEATHER_KEY,
      lat: lat,
      lon: lon,
    })
    .then(weatherInfo => {
      const weatherData = weatherInfo.body.data;
      const weatherArray = weatherData;
      const weatherResults = [];
      weatherArray.forEach(location => {
        weatherResults.push(new Weather(location));
      });
      response.send(weatherResults);
      response.status(200).send(weatherData);
    })
    .catch(error => console.log(error));
}

function movieHandler(request, response) {
  const url = 'https://api.themoviedb.org/3/search/movie';
  superagent.get(url)
    .query({});

  response.status(200).json({});
}

function trailHandler(request, response) {
  const url = 'https://www.hikingproject.com/data/get-trails';
  const lat = parseFloat(request.query.latitude);
  const lon = parseFloat(request.query.longitude);
  superagent.get(url)
    .query({
      key: process.env.TRAIL_KEY,
      lat: lat,
      lon: lon,
    })
    .then( trailData => {
      const trialDataArray = trailData.body.trails;
      const trailResults = [];
      trialDataArray.forEach(trail =>{
        trailResults.push(new Trail(trail));
      });
      response.send(trailResults);
      response.status(200).send(trialDataArray);
    })
    .catch(error => console.log(error));
}

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

function Weather(data) {
  this.time = data.datetime;
  this.forecast = data.weather.description;
}

function Restaurant(obj) {
  this.name = obj.name;
  this.url = obj.url;
  this.rating = obj.rating;
  this.price = obj.price;
  this.image_url = obj.image_url;
}

function Trail(info){
  this.name = info.name;
  this.location = info.location;
  this.length = info.length;
  this.stars = info.stars;
  this.star_votes = info.starVotes;
  this.summary = info.summary;
  this.trail_url = info.url;
  this.conditions = info.conditionStatus;
  this.condition_date = info.conditionDate.slice(0,10);
  this.condition_time = info.conditionDate.slice(12);
}

// App listener
client.connect()
  .then(() => {
    console.log('Postgres connected.');
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
  })
  .catch(err => {
    throw `Postgres error: ${err.message}`;
  });