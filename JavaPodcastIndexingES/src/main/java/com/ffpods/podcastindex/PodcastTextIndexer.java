/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.ffpods.podcastindex;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.apache.http.HttpHost;
import org.elasticsearch.ElasticsearchStatusException;
import org.elasticsearch.action.admin.indices.create.CreateIndexRequest;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.settings.Settings;

/**
 * Take the podcast text, and index (write to es) the speaker blocks to elastic search
 * We'll then take player names and search the podcasttext index for clips about the given player
 * @author jwalton
 */
public class PodcastTextIndexer {

    private static ObjectMapper mapper = new ObjectMapper();
    private RestHighLevelClient client;
    private String esHost = "localhost";

    public PodcastTextIndexer() throws Exception {
        init();
    }

    private void init() throws Exception {
        client = new RestHighLevelClient(
                RestClient.builder(
                        new HttpHost(esHost, 9200, "http"),
                        new HttpHost(esHost, 9201, "http")));

        try {
            //create index for podcasts, two document types
            //One document type for podcast text
            //Second one for player clips
            CreateIndexRequest createPodcastTextRequest = new CreateIndexRequest(Constants.PODCAST_TEXT_INDEX_NAME);
            createPodcastTextRequest.settings(Settings.builder()
                    .put("index.number_of_shards", 3)
                    .put("index.number_of_replicas", 2)
            );
            Map podcastTextMappings = mapper.readValue(this.getClass().getResourceAsStream("/podcast.text.mappings.json"), Map.class);
            createPodcastTextRequest.mapping(Constants.PODCAST_TEXT_DOCUMENT_TYPE, podcastTextMappings);

            client.indices().create(createPodcastTextRequest, RequestOptions.DEFAULT);
        } catch (ElasticsearchStatusException status) {
            System.out.println("Error creating podcast text index, Hopefully this is index already exists...");
//            System.out.println("Message: " + status.getDetailedMessage());
            status.printStackTrace();
        } catch (Exception e) {
            System.out.println("Other exception creating podcast text index");
            e.printStackTrace();
        }

        try {
            CreateIndexRequest createPlayerClipRequest = new CreateIndexRequest(Constants.PLAYER_CLIPS_INDEX_NAME);
            createPlayerClipRequest.settings(Settings.builder()
                    .put("index.number_of_shards", 3)
                    .put("index.number_of_replicas", 2)
            );
            Map playerClipMappings = mapper.readValue(this.getClass().getResourceAsStream("/podcast.player.mappings.json"), Map.class);

            createPlayerClipRequest.mapping(Constants.PLAYER_CLIPS_DOCUMENT_TYPE, playerClipMappings);

            client.indices().create(createPlayerClipRequest, RequestOptions.DEFAULT);
        } catch (ElasticsearchStatusException status) {
            System.out.println("Error creating player clip index, Hopefully this is index already exists...");
//            System.out.println("Message: " + status.getDetailedMessage());
            status.printStackTrace();
        } catch (Exception e) {
            System.out.println("Other exception creating player clip index");
            e.printStackTrace();
        }
    }

    public void writeToES(String startTime, String textToIndex, String documentId,String podcastName, String episodeName) throws IOException {
        Integer timeInSeconds = Utils.getTimeInSeconds(startTime.trim());
        System.out.println("Converted "+startTime+" to "+timeInSeconds +" seconds");
        IndexRequest request = new IndexRequest(Constants.PODCAST_TEXT_INDEX_NAME, Constants.PODCAST_TEXT_DOCUMENT_TYPE, documentId);
        Map<String, Object> jsonMap = new HashMap<>();
        jsonMap.put("podcast",podcastName);
        jsonMap.put("episodeTitle", episodeName);
        jsonMap.put("clipStartTime",timeInSeconds);
        jsonMap.put("clipText",textToIndex);
        request.source(jsonMap);
        client.index(request, RequestOptions.DEFAULT);
    }

    private void shutDown() {
        try {
            client.close();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public void indexFile(String file, String podcastName, String episodeName) throws IOException {
        InputStream stream = new FileInputStream(file);

        BufferedReader br = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
        String line = null;
        String timeStamp = "0:00:00";
        String textToIndex = "";
        int blockId = 0;
        while ((line = br.readLine()) != null) {
            String[] lineSplit = line.split("\\s+");
            if (lineSplit.length == 1) {
                if (line.indexOf(":") > 0) {
                    System.out.println("Found timestamp:" + timeStamp);
                    timeStamp = line;
                    continue;
                }
            }
            //format of file is 
            //$Timestamp
            //one-to-many lines of text
            //empty line
            //repeat
            if (line.isEmpty()) {
                writeToES(timeStamp, textToIndex, file+"."+blockId,podcastName, episodeName);
                blockId++;
                textToIndex = "";
                System.out.println("Processed block " + blockId);
            }
            textToIndex += line;

        }
        writeToES(timeStamp, textToIndex, file+"."+blockId,podcastName,episodeName);
        blockId++;
        System.out.println("Processed block " + blockId);

    }

    public static void main(String[] args) throws Exception {
        PodcastTextIndexer test = new PodcastTextIndexer();
        test.indexFile("/Users/jwalton/Downloads/podcastText/goodVibes.text", "FantasyFootballers", "Good Vibes");
        test.shutDown();
    }
}
