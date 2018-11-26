'use strict';

let Hapi = require('hapi');

describe("hapi-rascal", () => {

    let server;

    beforeAll(done => {
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

        const start = async function () {
            await server.register({ plugin: require('../lib'), options });
            await server.start();
        };

        try {
            start();
        }
        catch (err) {
            server.log('error', err);
        }

        expect(server.plugins.rascal).toBeDefined();
        expect(server.plugins.rascal.broker).toBeDefined("Check your rabbitmq connection options!");

        done();
    });


    it("should publish a message to foo and consume it", done => {

        let ourMessage = {
            content: 'the foo message content attribute'
        };

        server.plugins.rascal.broker.publish('foo', ourMessage, err => {

            expect(err).toBeFalsy();

            server.plugins.rascal.broker.subscribe('test', function (err, subscription) {

                expect(err).toBeFalsy();

                subscription.on('message', function (message, content, ackOrNack) {

                    expect(content).toEqual(jasmine.objectContaining(ourMessage));

                    expect(message.properties.contentType).toBe('application/json');
                    ackOrNack();

                    subscription.cancel(err => {
                        expect(err).toBeFalsy();
                        done();
                    })

                });

            }).on('error', err => {
                console.error('Subscriber error', err);
                done();
            });
        });

    });


    it("should publish to bar and consume it", done => {

        let ourMessage = 'the foo text message content';

        server.plugins.rascal.broker.publish('bar', ourMessage, err => {

            expect(err).toBeFalsy();

            server.plugins.rascal.broker.subscribe('test', function (err, subscription) {

                expect(err).toBeFalsy();

                subscription.on('message', function (message, content, ackOrNack) {

                    expect(content).toEqual(ourMessage);
                    expect(message.properties.contentType).toBe('text/plain');
                    ackOrNack();
                    done();

                }).on('error', err => {
                    console.error('Subscription error', err.message);
                    done();
                });

            });
        });


    });


    afterAll( async (done) => {
        try {
            await server.stop();
            done();
        }
        catch (err) {
            done.fail(err);
        }
    });
});