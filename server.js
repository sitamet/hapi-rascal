'use strict';

let Hapi = require('hapi');

const server = new Hapi.Server();

let options = {
    'vhosts': {
        '/': {
            'namespace': true,

            'connection': {
                hostname: process.env.WETOPI_RABBITMQ_HOST || 'rabbitmq',
                port: process.env.WETOPI_RABBITMQ_PORT_NODE || 5672,
                user: process.env.WETOPI_RABBITMQ_DEFAULT_USER || 'guest',
                password: process.env.WETOPI_RABBITMQ_DEFAULT_PASS || 'guest',
                vhost: process.env.WETOPI_RABBITMQ_DEFAULT_VHOST || 'wetopi'
            },


            'exchanges': {
                testEx: {
                    type: 'topic',
                    assert: true,
                    options: {
                        durable: true
                    }
                }
            },

            'queues': {
                test: {
                    assert: true,
                    purge: true

                }
            },

            'bindings': [
                'testEx[a.test.#] -> test'
            ],

            'publications': {
                foo: {
                    exchange: 'testEx',
                    routingKey: 'a.test.foo'
                },
                bar: {
                    exchange: 'testEx',
                    routingKey: 'a.test.bar'
                }

            },

            'subscriptions': {
                test: {
                    queue: 'test'
                }
            }
        }
    }
};

server.events.on('log', event => console.log(event.data));

const start = async function () {
    await server.register({ plugin: require('./lib'), options });
};

try {
    start().then(()=>{
        console.log(server.plugins);
    });
}
catch (err) {
    server.log('error', err);
}
