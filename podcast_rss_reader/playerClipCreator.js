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
        console.log("Matched episode", matchingItem);
       
        var players = null;
        try {
            //get transcribe output from S3
            const getPlayers = await s3.getObject({Bucket: 'ff-pods',Key: 'names.json'}).promise();
            var playerDataString = getPlayers.Body.toString();
            players = JSON.parse(playerDataString);           
        } catch(playerErr){
            console.log("Error getting players json file",playerErr.stack);
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
            for(var j = 0; j < items.length; j++){
                var item = items[j];
                if(item.type !== 'pronunciation'){
                    continue;
                }
                var text = item.alternatives[0].content;
                //see if word spoken was player
                var matchingPlayer = null;
                for(var k = 0; k < players.length; k++){
                    if(players[k].term === text){
                        matchingPlayer = players[k];
                        break;
                    }
                }
                if(!matchingPlayer){
                    continue;
                }
                console.log("Item: ",item);
                var clipStartTime = Math.round(parseFloat(item.start_time))-5;
                var clipEndTime = clipStartTime+30;                
                var clipText = [text];
                for(var z = j; z >= 0; z--){                    
                    var earlierItem = items[z];
                    if(earlierItem.type !== 'pronunciation'){
                        continue;
                    }
                    var earlierStartTime = Math.round(parseFloat(earlierItem.start_time));
                    if(earlierStartTime < clipStartTime){
                        break;
                    }                    
                    var earlierText = earlierItem.alternatives[0].content;
                    clipText.unshift(earlierText);
                }
                for(var z = j; z < items.length; z++){                    
                    var laterItem = items[z];
                    if(laterItem.type !== 'pronunciation'){
                        continue;
                    }
                    var laterStartTime = Math.round(parseFloat(laterItem.start_time));
                    if(laterStartTime > clipEndTime){
                        break;
                    }                    
                    var laterText = laterItem.alternatives[0].content;
                    clipText.push(laterText);
                }
                var date= new Date();
                var playerClip = {
                    podcast: podcast.name,
                    episodeTitle: matchingItem.title,
                    clipStartTime: clipStartTime,
                    clipEndTime :clipEndTime,
                    clipText:clipText.join(" "),
                    player: matchingPlayer.name,
                    clipUrl: matchingItem.enclosure.url,
                    pubDate: matchingItem.pubDate,
                    currentDate: date.getTime()
                };
                console.log("Output clip",playerClip);
                numClips++;
                const response = await client.index({
                    index: 'player_clips',
                    type: 'playerClips',
                    id: playerClip.player+"-"+playerClip.podcast+"-"+playerClip.episodeTitle+"-"+j,
                    body: playerClip
                  });
            }
        } catch (err) {
            console.log("Error getting transcribe output",err);
        }
       
    }
    console.log("Number of clips created: "+numClips);
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
//                     "name": "ff-pods",
//                     "ownerIdentity": {
//                         "principalId": "EXAMPLE"
//                     },
//                     "arn": "arn:aws:s3:::ff-pods"
//                 },
//                 "object": {
//                     "key": "Fantasy-Focus-Football-Week-4-Preview-.json",
//                     "size": 1024,
//                     "eTag": "0123456789abcdef0123456789abcdef",
//                     "sequencer": "0A1B2C3D4E5F678901"
//                 }
//             }
//         }
//     ]
// }

// exports.handler(testEvent);