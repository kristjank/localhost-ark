'use strict';

const container = require('@arkecosystem/core-container')

const productsHandlers = require('./handlers/products');
const inventoryHandlers = require('./handlers/inventory');
const transactionsHandlers = require('./handlers/transactions');

const register = async (server, options) => {
  const coreApi = container.resolveOptions('api');

  server.route([
    {
      method: 'GET',
      path: '/taco/products',
      ...productsHandlers.index
    },
    {
      method: 'POST',
      path: '/taco/inventory',
      ...inventoryHandlers.create
    },
    {
      method: 'POST',
      // transaction's creation needs to be intercepted
      path: '/transactions',
      ...transactionsHandlers.create
    },
    {
      method: '*',
      // all the other calls to the core-api can be proxied directly
      path: '/{path*}',
      handler: {
        proxy: {
          protocol: 'http',
          host: coreApi.host,
          port: coreApi.port,
          passThrough: true
        }
      }
    }
  ]);
};

exports.plugin = {
  name: 'inventory-api',
  version: '0.1.0',
  register
};
