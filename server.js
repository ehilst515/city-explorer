'use strict';

// Application Dependencies
const express = require('express');
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Route Definitions
app.use(express.static('./public'));
app.get('/greet', greetHandler);
app.get('/data', dataHandler);
app.get('/error', (request, response) => {
  throw new Error('Try again later');
});
app.use('*', notFoundHandler);
app.use(errorHandler);

// Route Handlers
function greetHandler(request, response) {
  response.status(200).send('Hello!');
}

function dataHandler(request, response) {
  const airplanes = [
    {
      departure: new Date(2020, 7, 24),
      canFly: true,
      pilot: 'Well Trained'
    },
    {
      departure: new Date(2020, 7, 25),
      canFly: false,
      pilot: 'NA'
    }
  ];
  response.status(200).json(airplanes);
}

function notFoundHandler(request, response) {
  response.status(404).json({ notFound: true });
}

function errorHandler(error, request, response, next) {
  response.status(500).json({ error: true, message: error.message });
}

// App listener
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
