var Rascal = require('rascal');

exports.register = function (plugin, config, next) {

    Rascal.Broker.create(Rascal.withDefaultConfig(config), function(err, broker) {

        if (err) {
            plugin.log('err','hapi-rascal: broker.create: ' + err.message);
        }

        broker.on('error', function(err) {
            plugin.log('err','hapi-rascal: broker.create: ' + err.message);
        });

        // expose broker at server.plugins.rascal.broker
        plugin.expose('broker', broker);

        next();

    });

};


exports.register.attributes = {
    name: 'rascal',
    pkg: require('../package.json')
};
