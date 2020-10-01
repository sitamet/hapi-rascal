'use strict';

const Broker = require('rascal').BrokerAsPromised;

exports.plugin = {

    'name': 'rascal',

    'pkg': require('../package.json'),

    'register': async (server, options) => {


        try {

            const broker = await Broker.create(options);

            broker.on('error', err => {
                server.log('error', `hapi-rascal: broker.create: ${err.message}`);
            });

            // Expose broker at server.servers.rascal.broker
            server.expose('broker', broker);


            // Expose rascal broker drivers at server.servers.rascal.driverName
            if (options.drivers) {
                options.drivers.forEach(driver => {
                    server.expose(driver.name, require(driver.module)(broker, driver.options));
                });
            }

        } catch (err) {
            throw new Error(`hapi-rascal: ${err.message}`);
        }
    }
};