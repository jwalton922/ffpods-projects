const express = require('express')
var cors = require('cors')
var bodyParser = require('body-parser')
// create application/json parser
var jsonParser = bodyParser.json()

const app = express()
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
app.use(awsServerlessExpressMiddleware.eventContext())

//probably should remove tis at some point...
app.use(cors())
var elasticsearch = require('elasticsearch');
let AWS = require('aws-sdk');
var chain = new AWS.CredentialProviderChain();
var client = null;
chain.resolve(function (err, cred) {
    AWS.config.update({
        credentials: cred,
        region: 'us-west-2'
    });
    client = require('elasticsearch').Client({
        hosts: ['https://search-ff-pods-public-vv3efpstye2a2lvyj72jjznxqm.us-west-2.es.amazonaws.com'],
        connectionClass: require('http-aws-es')
    });
});


// var client = new elasticsearch.Client({
//     host: 'localhost:9200',
//     log: 'trace'
// });

app.get('/', (req, res) => res.send('Hello World!'))
app.get('/playerSearch', (req, res) => {
    var name = req.query.name;
    client.search({
        index: 'player_list',
        type: 'player',
        body: {
            query: {
                match_phrase: {
                    name: name
                }
            }
        }
    }).then(function (resp) {
        var hits = resp.hits.hits;
        console.log("Received hits", hits);
        res.send(hits);
    }, function (err) {
        console.trace(err.message);
    });
});

app.post('/playerClips', jsonParser, (req, res) => {
    var promise;
    console.log("Request body", req.body);
    if (req.body.players) {
        var shouldQueries = [];
        var players = req.body.players;
        for (var i = 0; i < players.length; i++) {
            shouldQueries.push({ term: { "player.raw": players[i] } });
        }
        promise = client.search({
            index: 'player_clips',
            type: 'playerClips',
            from: 0,
            size: 1000,
            body: {
                query: {
                    bool: {
                        should: shouldQueries
                    }
                }
            }
        });
    } else {
        promise = client.search({
            index: 'player_clips',
            type: 'playerClips',
            from: 0,
            size: 20,
            body: {
                query: {
                    match_all: {
                    }
                }
            }
        });
    }
    promise.then(function (resp) {
        var hits = resp.hits.hits;
        console.log("Received hits", hits);
        res.send(hits);
    }, function (err) {
        console.trace(err.message);
    });
});
//only for local...figure out how to switch on env
//app.listen(3001, () => console.log('Example app listening on port 3001!'))

module.exports = app
