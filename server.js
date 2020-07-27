'use strict';

// Application Dependencies
const express = require('express');
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT;

// Route Definitions
app.get('/', rootHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

// Route Handlers
function rootHandler(request, response){
  response.status(200).send('City Explorer App')
}

function notFoundHandler(request, response) {
  response.status(404).json({ notFound: true });
}

function errorHandler(error, request, response, next) {
  response.status(500).json({ error: true, message: error.message });
}

// App listener
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
