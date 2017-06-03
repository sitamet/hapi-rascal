'use strict';

let Rascal = require('rascal');

exports.register = function (plugin, config, next) {

    Rascal.Broker.create(Rascal.withDefaultConfig(config), function(err, broker) {

        if (err) {
            plugin.log('error','hapi-rascal: broker.create: ' + err.message);

        } else {

            broker.on('error', err => {
                plugin.log('error','hapi-rascal: broker.create: ' + err.message);
            });
        }


        // expose broker at server.plugins.rascal.broker
        plugin.expose('broker', broker);


        // expose rascal broker drivers at server.plugins.rascal.driverName
        if (config.drivers) {

            config.drivers.forEach(driver => {
                plugin.expose(driver.name, require(driver.module)(broker, driver.options));
            });

        }

        next();

    });

};


exports.register.attributes = {
    name: 'rascal',
    pkg: require('../package.json')
};
