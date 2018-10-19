exports.handler = async (event) => {
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
    var s3 = new AWS.S3();
    let Parser = require('rss-parser');
    let parser = new Parser();

    //this is also in index.js
    var podcasts = [{
        name: 'Fantasy Footballers - Fantasy Football Podcast',
        url: 'https://thefantasyfootballers.libsyn.com/fantasyfootball'
    }, {
        name: 'Fantasy Focus Football',
        url: 'http://www.espn.com/espnradio/podcast/feeds/itunes/podCast?id=2942325'
    }];
    var numClips = 0;
    for (var i = 0; i < event.Records.length; i++) {
        var record = event.Records[i];
        var bucket = record.s3.bucket.name;
        var key = record.s3.object.key;
        console.log("Event for key " + key);
        //find matching podcast
        var matchingPodcast = null;
        for (var j = 0; j < podcasts.length; j++) {
            var podcast = podcasts[j];
            var name = podcast.name.replace(/[^a-zA-Z\d:]+/g, '-');
            if (key.indexOf(name) === 0) {
                matchingPodcast = podcast;
                break;
            }
        }
        if (!matchingPodcast) {
            console.log("Could not match podcast for key: " + key);
            return "Could not match podcast for key: " + key;
        }
        console.log("Matching podcast: " + podcast.name);
        let Parser = require('rss-parser');
        let parser = new Parser();
        let feed = await parser.parseURL(podcast.url);
        var podcastLink = feed.link;
        var matchingItem = null;
        //get matching episode
        for (var j = 0; j < feed.items.length; j++) {
            var item = feed.items[j];
            var episodeName = item.title.replace(/[^a-zA-Z\d:]+/g, '-');
            if (key.indexOf(episodeName) >= 0) {
                matchingItem = item;
                break;
            }
        }
        if (!matchingItem) {
            console.log("Could not match episode for key: " + key);
            return "Could not match episode for key";
        }
        var episodeLink = item.link ? item.link : podcastLink;
        console.log("Matched episode", matchingItem);

        var players = null;
        try {
            //get transcribe output from S3
            const getPlayers = await s3.getObject({ Bucket: 'ff-pods', Key: 'names.json' }).promise();
            var playerDataString = getPlayers.Body.toString();
            players = JSON.parse(playerDataString);
        } catch (playerErr) {
            console.log("Error getting players json file", playerErr.stack);
            return "Could not get players";
        }
        try {
            var getParams = {
                Bucket: bucket,
                Key: key
            }
            //get transcribe output from S3
            const getTranscribeOutput = await s3.getObject(getParams).promise();
            var dataString = getTranscribeOutput.Body.toString();
            var data = JSON.parse(dataString);
            var items = data.results.items;
            var podcastsByPlayer = {};
            for (var j = 0; j < items.length; j++) {
                var item = items[j];
                if (item.type !== 'pronunciation') {
                    continue;
                }
                var text = item.alternatives[0].content;
                //see if word spoken was player
                var matchingPlayer = null;
                for (var k = 0; k < players.length; k++) {
                    if (players[k].term === text) {
                        matchingPlayer = players[k];
                        break;
                    }
                }
                if (!matchingPlayer) {
                    continue;
                }
                console.log("Item: ", item);
                var clipStartTime = Math.round(parseFloat(item.start_time)) - 5;
                var clipEndTime = clipStartTime + 30;

                var date = new Date(matchingItem.pubDate);
                var processDate = new Date();
                var playerClip = {
                    podcast: podcast.name,
                    episodeTitle: matchingItem.title,
                    clipStartTime: clipStartTime,
                    clipEndTime: clipEndTime,                    
                    player: matchingPlayer.name,
                    clipUrl: matchingItem.enclosure.url,
                    pubDate: matchingItem.pubDate,
                    publishDate: date.getTime(),
                    currentDate: processDate.getTime(),
                    image: feed.image.url,
                    podcastLink: podcastLink,
                    episodeLink: episodeLink
                };
                console.log("Output clip", playerClip);
                numClips++;
                if (!podcastsByPlayer[playerClip.player]) {
                    podcastsByPlayer[playerClip.player] = []
                }
                podcastsByPlayer[playerClip.player].push(playerClip);

            } // end for looop podcast words
            //try to merge clips, clips should already by sorted
            var mergedClipsByPlayer = {};
            var mergeCount = 0;
            for (var player in podcastsByPlayer) {
                mergedClipsByPlayer[player] = [];
                var clips = podcastsByPlayer[player];
                var currentClip = clips[0];
                for (var i = 1; i < clips.length; i++) {
                    var nextClip = clips[i];
                    var delta = nextClip.clipEndTime - currentClip.clipEndTime;
                    if (delta < 60) {
                        currentClip.clipEndTime = nextClip.clipEndTime;
                        console.log("Merging clip. Previous start time: "+currentClip.clipEndTime+" new end time: "+currentClip.clipEndTime);
                        mergeCount++;
                    } else {
                        mergedClipsByPlayer[player].push(currentClip);
                        currentClip = nextClip;
                    }
                }
                mergedClipsByPlayer[player].push(currentClip);
            }
            var endClipCount = 0;
            for (var player in mergedClipsByPlayer) {
                var clips = mergedClipsByPlayer[player];
                
                for (var i = 0; i < clips.length; i++) {
                    endClipCount++;
                    var clipText = [];
                    var clipToIndex = clips[i];
                    var clipStartTime = clipToIndex.clipStartTime;
                    var clipEndTime = clipToIndex.clipEndTime;
                    for (var z = 0; z < items.length; z++) {
                        var startTime = Math.round(parseFloat(items[z].start_time));
                        if (startTime < clipStartTime) {
                            continue;
                        } else if (startTime > clipEndTime) {
                            break;
                        } 
                        if(!startTime){
                            continue;
                        }
                        var text = items[z].alternatives[0].content;
                       
                        clipText.push(text);
                    }
                    
                    
                    clipToIndex.clipText = clipText.join(" ");
                    clipToIndex.clipText = clipToIndex.clipText.replace(/-/g, " ");
                    
                    console.log("Indexing clip: "+endClipCount+" player: "+clipToIndex.player);
                    console.log("Clip text: "+clipToIndex.clipText);
                    const response = await client.index({
                        index: 'player_clips',
                        type: 'playerClips',
                        id: clipToIndex.player + "-" + clipToIndex.podcast + "-" + clipToIndex.episodeTitle + "-" + i,
                        body: clipToIndex
                    });
                }
            }

            console.log("Original clip size: " + numClips + ". Merged clips: " + mergeCount + '. End clip count: ' + endClipCount);
        } catch (err) {
            console.log("Error getting transcribe output", err);
        }

    }
    console.log("Number of clips created: " + numClips);
    return "Success";
}

// var testEvent = {
//     "Records": [
//         {
//             "eventVersion": "2.0",
//             "eventSource": "aws:s3",
//             "awsRegion": "us-west-2",
//             "eventTime": "1970-01-01T00:00:00.000Z",
//             "eventName": "ObjectCreated:Put",
//             "userIdentity": {
//                 "principalId": "EXAMPLE"
//             },
//             "requestParameters": {
//                 "sourceIPAddress": "127.0.0.1"
//             },
//             "responseElements": {
//                 "x-amz-request-id": "EXAMPLE123456789",
//                 "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH"
//             },
//             "s3": {
//                 "s3SchemaVersion": "1.0",
//                 "configurationId": "testConfigRule",
//                 "bucket": {
//                     "name": "ff-pods-transcribe-output",
//                     "ownerIdentity": {
//                         "principalId": "EXAMPLE"
//                     },
//                     "arn": "arn:aws:s3:::ff-pods"
//                 },
//                 "object": {
//                     "key": "Fantasy-Focus-Football-Week-7-Rankings.json",
//                     "size": 1024,
//                     "eTag": "0123456789abcdef0123456789abcdef",
//                     "sequencer": "0A1B2C3D4E5F678901"
//                 }
//             }
//         }
//     ]
// }

// exports.handler(testEvent);