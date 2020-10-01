# Hapi plugin version of [Rascal](https://github.com/guidesmiths/rascal), a config driven wrapper around [amqplib](https://www.npmjs.com/package/amqplib)


## Install

```sh
npm install hapi-rascal --save
```

## Usage

With a Rascal config, [read more](https://github.com/guidesmiths/rascal)

```javascript

let options = {
    'vhosts': {
        '/': {

            'connection': {
                hostname: 'localhost',
                port: 5672,
                user: process.env.WETOPI_RABBITMQ_DEFAULT_USER || 'guest',
                password: process.env.WETOPI_RABBITMQ_DEFAULT_PASS || 'guest'
            },

            'exchanges': {
                testEx: {
                    type: 'topic',
                    options: {
                        durable: true
                    }
                }
            },

            'queues': {
                test: {
                    options: {
                        durable: true,
                        exclusive: false
                    }
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
                    queue: 'test',
                    contentType: 'application/json'
                }
            }


        }
    }
};
```

Plus the option to add a driver:

```javascript

let options = {
    'vhosts': {...},
    'drivers': [{
        module: 'hapi-message-manager',
        name: 'events',
        options: {
            publication: 'dom.obj.act.det'
        }
    }]
};
```

e.g.  [hapi-message-manager](https://github.com/sitamet/hapi-message-manager)


### Register the hapi-rascal plugin

```javascript
server.register({ register: 'hapi-rascal', options: options });
```

### Consume the service:

Once registered you get a broker object you can consume:

```javascript

// publish:
server.plugins.rascal.broker.publish('foo', { 'my': 'message to foo'});
server.plugins.rascal.broker.publish('bar', { 'my': 'message to bar'});


// subscribe:
server.plugins.rascal.broker.subscribe('test', function(err, subscription) {
    subscription.on('message', function(message, content, ackOrNack) {

        console.log('[*] Consumed message from test queue. content:', content);
        ackOrNack();

    }).on('error', function(err) {
        console.error('Subscriber error', err);

    }).on('invalid_content', function(err, message, ackOrNack) {
        console.error('Invalid content', err);
        ackOrNack(err);
    });
    
}).on('error', console.error);

```

### Consume the service through a driver:

Following the driver in the example.
The sample driver `publish` method gets exposed as:

```javascript
server.plugins.rascal.broker.publish({ message }, 'domain-a.message.event.sample-event');
```


## Running the tests

Bebore running test, check test connection section.

```bash
npm test
```
You'll need a RabbitMQ server running locally with default configuration. If that's too much trouble try installing [docker](https://www.docker.com/) and running the following
```
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq
```


