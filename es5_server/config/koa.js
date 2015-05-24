'use strict';

var fs = require('fs'),
    logger = require('koa-logger'),
    send = require('koa-send'),
    jwt = require('koa-jwt'),
    cors = require('koa-cors'),
    bodyParser = require('koa-bodyparser'),
    router = require('koa-router'),
    config = require('./environment');

var generateApi = require('koa-mongo-rest');
var pluralize = require('pluralize');
var mongoose = require('mongoose');

module.exports = function (app) {
  // middleware configuration
  app.use(router(app));
  app.use(logger());
  app.use(cors({
    maxAge: config.app.cacheTime / 1000,
    credentials: true,
    methods: 'GET, HEAD, OPTIONS, PUT, POST, DELETE',
    headers: 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  }));
  app.use(bodyParser());

  // middleware below this line is only reached if jwt token is valid
  // TODO enable jwt auth app.use(jwt({secret: config.app.secret}));

  // mount all the routes defined in the api controllers
  fs.readdirSync(__dirname + '/../controllers').forEach(function (file) {
    require(__dirname + '/../controllers/' + file).init(app);
  });

  // mount REST routes for all models
  var model = undefined,
      schema = undefined;
  require('fs').readdirSync(__dirname + '/../models').forEach(function (name) {
    if (name[0] === '.') return;
    name = name.substring(0, name.length - 3);
    schema = require('../models/' + name);
    model = mongoose.model(pluralize(name), schema);
    generateApi(app, model, '/api');
  });
};