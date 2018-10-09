var s3Bucket = 'ff-pods';
var s3KeyRoot = 'podcasts/';
exports.rssHandler = function (event, context, callback) {
    let Parser = require('rss-parser');
    let parser = new Parser();
    var AWS = require('aws-sdk');
    var s3 = new AWS.S3();
    var streamingS3 = require('streaming-s3'),
        request = require('request');

    //this is also in playerClipCreator
    var podcasts = [{
        name: 'Fantasy Footballers - Fantasy Football Podcast',
        url: 'https://thefantasyfootballers.libsyn.com/fantasyfootball'
    }, {
        name: 'Fantasy Focus Football',
        url: 'http://www.espn.com/espnradio/podcast/feeds/itunes/podCast?id=2942325'
    }];
    var completedPodcasts = 0;
    var errorCount = 0;
    function podcastComplete(err, message) {
        completedPodcasts++;
        if (err) {
            errorCount++;
        }
        console.log("Have completed " + completedPodcasts + "/" + podcasts.length + " podcasts");
        if (completedPodcasts === podcasts.length) {
            var error = errorCount <= 0 ? null : { errors: errorCount, total: podcasts.length };
            console.log("Error being returned? ", error);
            callback(error, "Success " + completedPodcasts + "/" + podcasts.length);
        }
    }

    async function readRSS(podcast, finishedCallback) {

        let feed = await parser.parseURL(podcast.url);
        // console.log("Feed",feed);
        console.log("Image",feed.image);
        console.log("Image URL: ",feed.image.url);
        console.log(feed.title);
        var item = feed.items[0];
        console.log('Title: ' + item.title + ' value:' + item.link + " pub date: " + item.pubDate);
        console.log("Enclosure: " + item.enclosure.url);
        var type = item.enclosure.type.substring(item.enclosure.type.indexOf('/') + 1);
        console.log("File type: " + type);
        var outputPodcastFile = item.title + '.' + type;
        var key = s3KeyRoot + podcast.name + '/' + outputPodcastFile;
        key = key.trim();
        // Using async/await (untested)
        try {
            console.log("Checking for object: "+key+" in "+s3Bucket);
            var params = { Bucket: s3Bucket, Key: key };
            const headCode = await s3.headObject(params).promise();
            console.log("Head code: ", headCode);
            finishedCallback(null, "Already Downloaded");
            // Do something with signedUrl
        } catch (headErr) {

            if (headErr.code === 'NotFound') {
                // Handle no object on cloud here  
                console.log("Have not downloaded podcast. Copying it to S3");
                console.log("S3 location: " + s3Bucket + "/" + key);
                var rStream = request.get(item.enclosure.url);
                var uploader = new streamingS3(rStream, {},
                    {
                        Bucket: s3Bucket,
                        Key: key,
                        ContentType: item.enclosure.type
                    },
                    {
                        concurrentParts: 2,
                        waitTime: 10000,
                        retries: 1,
                        maxPartSize: 10 * 1024 * 1024
                    },
                    function (e, resp, stats) {
                        if (e) {
                            console.log("Error uploading " + key + " to s3");
                            console.log("Error: ",e);
                            finishedCallback(e);
                        } else {
                            console.log('Upload stats: ', stats);
                            console.log('Upload successful: ', resp);
                            finishedCallback(null, "Success.");
                        }
                    }
                );

            }
        }
        // feed.items.forEach(item => {
        //   console.log('Title: '+item.title + ' value:' + item.link);
        //   break;
        // });

    };



    for (var i = 0; i < podcasts.length; i++) {
        readRSS(podcasts[i], podcastComplete);
    }

}

// exports.rssHandler(null, null, function(error,msg){
//     console.log("Error",error);
//     console.log("Messgae",msg);
// })