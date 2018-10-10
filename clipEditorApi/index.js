const express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
// create application/json parser
var jsonParser = bodyParser.json();
const fetch = require("node-fetch");
const app = express();
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
app.use(awsServerlessExpressMiddleware.eventContext());

//probably should remove tis at some point...
app.use(cors());
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
                wildcard: {
                    name: name + '*'
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

app.post('/getLink', jsonParser, async (req, res) => {
    if (req.body.url) {
        console.log("getting link for url: " + req.body.url);
        if (req.body.url.indexOf('https://www.ffpodcastsearch.com') !== 0 &&
            req.body.url.indexOf('https://www.fspodcastsearch.com') !== 0
        ) {
            throw new Error("Invalid domain");
        }
        var encodedUrl = encodeURIComponent(req.body.url);
        var bityAuthToken = '859898adba9c88a815b2401086f1b27b8362808f';
        var bitlyUrl = 'https://api-ssl.bitly.com/v3/shorten?access_token=' + bityAuthToken + "&longUrl=" + encodedUrl;
        try {
            const response = await fetch(bitlyUrl);
            const json = await response.json();
            console.log('bitly response', json);
            res.send(json.data);
        } catch (error) {
            console.log(error);
            res.send({ url: 'error' });
        }
    } else {
        res.send({ url: 'error' });
    }
});

app.get('/latestEpisodes', (req, res) => {
    promise = client.search({
        index: 'player_clips',
        type: 'playerClips',
        size: 0,
        body: {
            aggs: {
                podcast: {
                    terms: {
                        field: "podcast.raw"
                    },
                    aggregations: {
                        episode: {
                            terms: {
                                field: "episodeTitle.raw"
                            }, aggregations: {
                                publishDate: {
                                    terms: {
                                        field: "publishDate"
                                    }
                                }
                            }
                        }
                    }

                }
            }
        }
    });

    promise.then(function (resp) {
        // console.log("Received response", resp);
        var podcasts = {};
        var podcastBuckets = resp.aggregations.podcast.buckets;
        // console.log("Podcast: ",resp.aggregations.podcast);
        for (var i = 0; i < podcastBuckets.length; i++) {
            var bucket = podcastBuckets[i];
            var podcast = bucket.key;
            var episodeBuckets = bucket.episode.buckets;
            for (var j = 0; j < episodeBuckets.length; j++) {
                var episodeBucket = episodeBuckets[j];
                var epiode = episodeBucket.key;
                // console.log("Episode bucket",episodeBucket);
                if(!episodeBucket.publishDate || !episodeBucket.publishDate.buckets ||!episodeBucket.publishDate.buckets[0]){
                    continue;
                }
                var publishDate = episodeBucket.publishDate.buckets[0].key
                console.log("Publishd date: ",publishDate);
                if (!podcasts[podcast]) {
                    podcasts[podcast] = { podcast: podcast, episode: epiode, publishDate: publishDate };
                } else {
                    if (publishDate > podcasts[podcast].publishDate) {
                        podcasts[podcast] = { podcast: podcast, episode: epiode, publishDate: publishDate };
                    }
                }
            }
        }
       
        res.send(podcasts);
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
        var currentDate = new Date();
        var minDate = new Date();
        minDate.setTime(currentDate - (4 * 24 * 3600 * 1000));
        console.log("Min date: " + minDate.getTime);
        promise = client.search({
            index: 'player_clips',
            type: 'playerClips',
            from: 0,
            size: 1000,
            body: {
                query: {
                    bool: {
                        must: [
                            { bool: { should: shouldQueries } }],
                        filter: {
                            range: {
                                publishDate: {
                                    gte: minDate.getTime()
                                }
                            }
                        }
                    }
                },
                sort: [
                    { "pubDate.keyword": "desc" },
                    { "podcast.raw": "desc" },
                    { "clipStartTime": "asc" },
                    "_score"
                ]
            }
        });
    } else if (req.body.id) {
        promise = client.search({
            index: 'player_clips',
            type: 'playerClips',
            from: 0,
            size: 20,
            body: {
                query: {
                    ids: {
                        values: [req.body.id]
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
                },
                sort: [
                    { "pubDate.keyword": "desc" },
                    { "podcast.raw": "desc" },
                    { "clipStartTime": "asc" },
                    "_score"
                ]
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
app.listen(3001, () => console.log('Example app listening on port 3001!'))

module.exports = app;
