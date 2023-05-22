'use strict';

/* eslint-disable no-console */

let Hapi = require('@hapi/hapi');

describe('hapi-rascal', () => {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

    let server;

    beforeAll(async () => {
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

        server = new Hapi.Server();

        server.events.on('log', event => console.log(event.data));


        try {

            const start = async () => {
                await server.register({ plugin: require('../lib'), options });
            };

            await start();

            expect(server.plugins).toBeDefined();
            expect(server.plugins.rascal.broker).toBeDefined('Check your rabbitmq connection options!');

        } catch (err) {
            fail(err);
        }
    });


    it('should async publish a message to foo and consume it', async () => {

        let ourMessage = {
            content: 'the foo message content attribute'
        };

        const subscription = await server.plugins.rascal.broker.subscribe('test');

        const publication = await server.plugins.rascal.broker.publish('foo', ourMessage);
        publication.on('error', err => {
            throw err;
        });

        await new Promise((resolve, reject) => {
            subscription.on('message', (message, content, ackOrNack) => {
                try {
                    expect(content).toEqual(jasmine.objectContaining(ourMessage));
                    expect(message.properties.contentType).toBe('application/json');
                    ackOrNack();
                    subscription.cancel();
                    resolve();
                } catch (err) {
                    reject(err);
                }
            }).on('error', reject);
        });
    });


    it('should async publish to bar and consume it', async () => {

        let ourMessage = {
            content: 'the bar text message content'
        };

        const subscription = await server.plugins.rascal.broker.subscribe('test');

        await server.plugins.rascal.broker.publish('bar', ourMessage);

        await new Promise((resolve, reject) => {
            subscription.on('message', (message, content, ackOrNack) => {
                try {
                    expect(content).toEqual(jasmine.objectContaining(ourMessage));
                    expect(message.properties.contentType).toBe('application/json');
                    ackOrNack();
                    subscription.cancel();
                    resolve();
                } catch (err) {
                    reject(err);
                }
            }).on('error', reject);
        });
    });


    afterAll(async () => {
        await server.plugins.rascal.broker.nuke();
        await server.stop();
    });
});