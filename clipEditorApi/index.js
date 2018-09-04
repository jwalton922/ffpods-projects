const express = require('express')
var cors = require('cors')
const app = express()
//probably should remove tis at some point...
app.use(cors())
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
});

app.get('/', (req, res) => res.send('Hello World!'))
app.get('/playerClips', (req, res) => {
    client.search({
        index: 'player_clips',
        type: 'playerClips',
        body: {
            query: {
                match_all: {                    
                }
            }
        }
    }).then(function (resp) {
        var hits = resp.hits.hits;
        console.log("Received hits",hits);
        res.send(hits);
    }, function (err) {
        console.trace(err.message);
    });
});
app.listen(3001, () => console.log('Example app listening on port 3001!'))
