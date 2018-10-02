exports.handler = async (event) => {
    var AWS = require('aws-sdk');
    var s3 = new AWS.S3();
    var transcribeservice = new AWS.TranscribeService({apiVersion: '2017-10-26', region: 'us-west-2'});
    var s3Bucket = 'ff-pods';
    var outputS3Bucket = 'ff-pods-transcribe-output';
    var s3KeyRoot = 'podcasts/';
    var errors = [];
    var messages = [];
    for (var i = 0; i < event.Records.length; i++) {
        var record = event.Records[i];
        if (record.s3.bucket.name === s3Bucket) {
            console.log("Event for bucket: " + record.s3.bucket.name);
            var key = record.s3.object.key;
            if (key.indexOf(s3KeyRoot) == 0) {
                console.log("Found new podcast", key);
                var podcastName = key.substring(key.indexOf('podcasts/') + 9);
                podcastName = podcastName.substring(0, podcastName.indexOf("/"));
                console.log("Podcast name: " + podcastName);
                var fileName = key.substring(key.lastIndexOf("/") + 1, key.lastIndexOf('.'));
                fileName = decodeURIComponent(fileName);
                console.log("Decoded File name: " + fileName);
                
                var transcribeOutput = podcastName + "-" + fileName;
                transcribeOutput = transcribeOutput.replace(/[^a-zA-Z\d:]+/g, '-');
                console.log("Looking for transcribeOutput: " + transcribeOutput);
                try {
                    var params = { Bucket: outputS3Bucket, Key: transcribeOutput };
                    const headCode = await s3.headObject(params).promise();
                    console.log("Head code: ", headCode);
                    messages.push("Already Handled Transcribe");
                    // Do something with signedUrl
                } catch (headErr) {
                    if (headErr.code === 'NotFound') {
                        console.log("New podcast, calling transcribe");
                        var mediaFile = 'https://s3-us-west-2.amazonaws.com/' + s3Bucket + '/' + key;
                        var mediaType = key.substring(key.lastIndexOf('.') + 1);
                        var transcibeParams = {
                            LanguageCode: 'en-US', /* required */
                            Media: { /* required */
                                MediaFileUri: mediaFile
                            },
                            MediaFormat: mediaType, /* required */
                            TranscriptionJobName: transcribeOutput, /* required */
                            OutputBucketName: outputS3Bucket,
                            Settings: {
                                ChannelIdentification: false,
                                ShowSpeakerLabels: false,
                                VocabularyName: 'players'
                            }
                        };
                        console.log("transcribe params", transcibeParams);
                        try {
                            const transcribeCode = await transcribeservice.startTranscriptionJob(transcibeParams).promise();
                            messages.push("Created transcribe job");
                        } catch (transcribeErr) {
                            console.log(transcribeErr, transcribeErr.stack); // an error occurred
                        }
                    }
                }
            }
        }
    }

    return { messsages: messages };
};


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
//                     "key": "podcasts/Fantasy+Focus+Football/Week+4+Preview+.mp3",
//                     "size": 1024,
//                     "eTag": "0123456789abcdef0123456789abcdef",
//                     "sequencer": "0A1B2C3D4E5F678901"
//                 }
//             }
//         }
//     ]
// }
// exports.handler(testEvent);