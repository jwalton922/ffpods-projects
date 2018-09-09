/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.ffpods.podcastindex;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.apache.http.HttpHost;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.document.DocumentField;
import org.elasticsearch.common.unit.TimeValue;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.builder.SearchSourceBuilder;

/**
 *
 * @author jwalton
 */
public class PlayerClipFinder {

    private RestHighLevelClient client;
    private String esHost = "localhost";

    public PlayerClipFinder() {
        init();
    }

    private void init() {

        client = new RestHighLevelClient(
                RestClient.builder(
                        new HttpHost(esHost, 9200, "http"),
                        new HttpHost(esHost, 9201, "http")));
    }

    public List<String> getPlayerNames() {
//        List<String> playersToQuery = Arrays.asList(
//                "Andrew Luck",
//                "Julio Jones",
//                "Leonard Fournette",
//                "Greg Olsen",
//                "Jarvis Landry",
//                "Chris Carson",
//                "Michael Crabtree",
//                "Alshon Jeffery",
//                "Isaiah Crowell",
//                "Rashaad Penny",
//                "Marvin Jones",
//                "Alvin Kamara",
//                "Saints Defense"
//        );
        PlayerParser parser = new PlayerParser();
        List<String> playersToQuery = null;
        try {
            playersToQuery = parser.getPlayers();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return playersToQuery;
    }

    private SearchResponse searchForPlayer(String playerName) {

        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.matchPhraseQuery("clipText", playerName));
        sourceBuilder.from(0);
        sourceBuilder.size(5);
        sourceBuilder.timeout(new TimeValue(60, TimeUnit.SECONDS));

        SearchRequest searchRequest = new SearchRequest();
        searchRequest.indices(Constants.PODCAST_TEXT_INDEX_NAME);
        searchRequest.source(sourceBuilder);

        System.out.println("Query: " + sourceBuilder.toString());
        try {
            return client.search(searchRequest, RequestOptions.DEFAULT);
        } catch (IOException io) {
            throw new RuntimeException(io);
        }
    }

    public void writePlayerClip(String playerName, String podcast, String episodeTitle, Integer clipStartTime, Integer clipEndTime, String clipText, String sourceId) {
        String id = playerName + "_" + sourceId;
        IndexRequest request = new IndexRequest(Constants.PLAYER_CLIPS_INDEX_NAME, Constants.PLAYER_CLIPS_DOCUMENT_TYPE, id);
        Map<String, Object> jsonMap = new HashMap<>();
        jsonMap.put("podcast", podcast);
        jsonMap.put("episodeTitle", episodeTitle);
        jsonMap.put("clipStartTime", clipStartTime);
        jsonMap.put("clipEndTime", clipEndTime);
        jsonMap.put("clipText", clipText);
        jsonMap.put("player", playerName);
        request.source(jsonMap);
        try {
            client.index(request, RequestOptions.DEFAULT);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }

    public void findPlayerClips() {
        List<String> players = getPlayerNames();
        for (String player : players) {
            SearchResponse response = searchForPlayer(player);
            SearchHits hits = response.getHits();
            System.out.println(player + ": total of " + hits.totalHits + " total hits");
            int index = 0;
            for (SearchHit hit : response.getHits()) {
                index++;
                if (hit == null) {
                    System.out.println("Hit is null?");
                    continue;
                }
                Map<String, Object> sourceAsMap = hit.getSourceAsMap();
                String clipText = (String) sourceAsMap.get("clipText");
                String podcast = (String) sourceAsMap.get("podcast");
                String episodeTitle = (String) sourceAsMap.get("episodeTitle");
                Integer clipStartTime = (Integer) sourceAsMap.get("clipStartTime");
                Integer clipEndTime = clipStartTime + 30;
                String sourceId = hit.getId();
                System.out.println(player + " index: " + index + " clip: " + clipText);

                writePlayerClip(player, podcast, episodeTitle, clipStartTime, clipEndTime, clipText, sourceId);
            }
        }
        try {
            client.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) throws Exception {
        PlayerClipFinder finder = new PlayerClipFinder();

        finder.findPlayerClips();
    }
}
