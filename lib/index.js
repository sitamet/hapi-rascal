'use strict';

const Rascal = require('rascal');
const util = require('util');

exports.plugin = {

    'name': 'rascal',

    'pkg': require('../package.json'),

    'register': async (server, options) => {


        const createBroker = util.promisify(Rascal.Broker.create.bind(Rascal.Broker));

        try {

            let broker = await createBroker(Rascal.withDefaultConfig(options));

            broker.on('error', err => {
                server.log('error', 'hapi-rascal: broker.create: ' + err.message);
            });

            // expose broker at server.servers.rascal.broker
            server.expose('broker', broker);

            broker.publishAsync = util.promisify(broker.publish);
            broker.subscribeAsync = util.promisify(broker.subscribe);
            broker.nukeAsync = util.promisify(broker.nuke);

            // expose rascal broker drivers at server.servers.rascal.driverName
            if (options.drivers) {
                options.drivers.forEach(driver => {
                    server.expose(driver.name, require(driver.module)(broker, driver.options));
                });
            }
        }

        catch (err) {
            server.log('error', 'hapi-rascal: broker.create: ' + err.message);
        }
    }
};
