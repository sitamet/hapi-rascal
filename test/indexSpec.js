var Hapi = require('hapi');

describe("hapi-rascal", function () {

    var server;

    it("shoud start our server registering the plugin", function (done) {
        var options = {
            'vhosts': {
                '/': {
                    'namespace': true,

                    'connection': {
                        hostname: process.env.WETOPI_RABBITMQ_HOST || 'localhost',
                        port: 5679,
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

        server.register({
            register: require('../lib'),
            options: options
        }, function (err) {

            expect(err).toBeFalsy();
            expect(server.plugins.rascal).toBeDefined();

            done();

        });
    });


    it("should publish a message to foo and consume it", function (done) {

        var ourMessage = {
            content: 'the foo message content attribute'
        };


        server.plugins.rascal.broker.publish('foo', ourMessage, function(err) {

            expect(err).toBeFalsy();

            server.plugins.rascal.broker.subscribe('test', function(err, subscription) {

                expect(err).toBeFalsy();

                subscription.on('message', function(message, content, ackOrNack) {

                    expect(content).toEqual(jasmine.objectContaining(ourMessage));

                    console.log(content);

                    expect(message.properties.contentType).toBe('application/json');
                    ackOrNack();

                    subscription.cancel(function(err) {
                        expect(err).toBeFalsy();
                        done();
                    })

                });

            }).on('error', function(err) {
                console.error('Subscriber error', err);
                done();
            });
        });

    });


    it("should publish to bar and consume it", function (done) {

        var ourMessage = 'the foo text message content';

        server.plugins.rascal.broker.publish('bar', ourMessage, function(err) {

            expect(err).toBeFalsy();

            server.plugins.rascal.broker.subscribe('test', function(err, subscription) {

                expect(err).toBeFalsy();

                subscription.on('message', function(message, content, ackOrNack) {

                    expect(content).toEqual(ourMessage);
                    expect(message.properties.contentType).toBe('text/plain');
                    ackOrNack();
                    done();

                }).on('error', function(err) {
                    console.error('Subscription error', err.message);
                    done();
                });

            });
        });


    });


    it("shoud stop our server", function (done) {
        server.stop(function(err) {
            expect(err).toBeFalsy();
            done();
        });
    });
});