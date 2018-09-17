/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.ffpods.podcastindex;

import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.ffpods.podcastindex.data.Player;
import com.ffpods.podcastindex.data.PlayerClip;
import java.io.IOException;
import java.util.ArrayList;
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
import org.elasticsearch.common.unit.TimeValue;
import org.elasticsearch.index.query.QueryBuilder;
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
    private String esHost = "https://search-ff-pods-public-vv3efpstye2a2lvyj72jjznxqm.us-west-2.es.amazonaws.com";//localhost";

    public PlayerClipFinder() {
        init();
    }

    private void init() {
        if(esHost.equalsIgnoreCase("localhost")){
        client = new RestHighLevelClient(
                RestClient.builder(
                        new HttpHost(esHost, 9200, "http"),
                        new HttpHost(esHost, 9201, "http")));
        } else {
            client = ElasticsearchServiceUtil.esClient(esHost, "us-west-2", new DefaultAWSCredentialsProviderChain());
        }
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
        PlayerParser parser = new PlayerParser(null);
        List<String> playersToQuery = new ArrayList<>();
        try {
            List<Player> players = parser.getPlayers();
            for (Player player : players) {
                playersToQuery.add(player.getName().trim());
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        return playersToQuery;
    }

    private SearchResponse searchForPlayer(String playerName, String podcast, String episode) {

        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();

        sourceBuilder.query(QueryBuilders.boolQuery().must(QueryBuilders.matchPhraseQuery("clipText", playerName))
                .filter(QueryBuilders.termQuery("podcast.raw", podcast))
                .filter(QueryBuilders.termQuery("episodeTitle.raw", episode)));
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

    public void writePlayerClip(PlayerClip playerClip) {
        String playerName = playerClip.getPlayer();
        String podcast = playerClip.getPodcast();
        String episodeTitle = playerClip.getEpisodeTitle();
        Integer clipStartTime = playerClip.getClipStartTime();
        Integer clipEndTime = playerClip.getClipEndTime();
        String clipText = playerClip.getClipText();
        String id = playerClip.getId();
        String s3Location = playerClip.getS3Location();

        IndexRequest request = new IndexRequest(Constants.PLAYER_CLIPS_INDEX_NAME, Constants.PLAYER_CLIPS_DOCUMENT_TYPE, id);
        Map<String, Object> jsonMap = new HashMap<>();
        jsonMap.put("podcast", podcast);
        jsonMap.put("episodeTitle", episodeTitle);
        jsonMap.put("clipStartTime", clipStartTime);
        jsonMap.put("clipEndTime", clipEndTime);
        jsonMap.put("clipText", clipText);
        jsonMap.put("player", playerName);
        jsonMap.put("s3Location", s3Location);
        request.source(jsonMap);
        try {
            client.index(request, RequestOptions.DEFAULT);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }

    public List<PlayerClip> findPlayerClips(String searchPodcast, String searchEpisode, boolean writeToEs) {
        List<PlayerClip> retList = new ArrayList<>();
        List<String> players = getPlayerNames();
        for (String player : players) {
            SearchResponse response = searchForPlayer(player, searchPodcast, searchEpisode);
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
                String id = player + "_" + sourceId;
                System.out.println(player + " index: " + index + " clip: " + clipText);
                PlayerClip clip = new PlayerClip();
                clip.setClipEndTime(clipEndTime);
                clip.setClipStartTime(clipStartTime);
                clip.setClipText(clipText);
                clip.setEpisodeTitle(episodeTitle);
                clip.setId(id);
                clip.setPlayer(player);
                clip.setPodcast(podcast);
                if (writeToEs) {
                    writePlayerClip(clip);
                }
                retList.add(clip);
            }
        }

        return retList;
    }

    public void shutdown() {
        try {
            client.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) throws Exception {
        PlayerClipFinder finder = new PlayerClipFinder();
        String player = "Aaron Rodgers";
        SearchResponse response = finder.searchForPlayer(player, "Fantasy Footballers - Fantasy Football Podcast", "Week 1 Studs & Duds, Rising Stars, Trey Doo-Doo");
        SearchHits hits = response.getHits();
            System.out.println(player + ": total of " + hits.totalHits + " total hits");
            finder.shutdown();
//        finder.findPlayerClips("Fantasy Footballers", "goodVibes",true);
    }
}
