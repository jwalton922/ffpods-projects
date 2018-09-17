/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.ffpods.podcastindex;

import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ffpods.podcastindex.config.ElasticsearchConfig;
import com.ffpods.podcastindex.data.Player;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.apache.http.HttpHost;
import org.elasticsearch.ElasticsearchStatusException;
import org.elasticsearch.action.admin.indices.create.CreateIndexRequest;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.settings.Settings;

/**
 *
 * @author jwalton
 */
public class PlayerParser {
    //not really a csv
    private final String file = "/players.csv";      
    private static ObjectMapper mapper = new ObjectMapper();
    private RestHighLevelClient client;
    
    private ElasticsearchConfig esConfig = new ElasticsearchConfig();
    
    public PlayerParser(ElasticsearchConfig esConfig){
        if(esConfig != null){
            this.esConfig = esConfig;
        }
    }
    
    
    public List<Player> getPlayers() throws Exception{
        BufferedReader br = new BufferedReader(new InputStreamReader(this.getClass().getResourceAsStream(file)));
        String line = null;
        List<Player> players = new ArrayList<>();
        while((line = br.readLine()) != null){
            int indexOfPeriod = line.indexOf(".");
             if(indexOfPeriod < 0){
                continue;
            }
            String playerInfo = line.substring(indexOfPeriod+1);
            String[] playerInfoSplit = playerInfo.split("\t");
            System.out.println("Name: "+playerInfoSplit[0]);
            Player player = new Player();
            player.setName(playerInfoSplit[0].trim());
            player.setPosition(playerInfoSplit[1].trim());
            player.setTeam(playerInfoSplit[2].trim());
            players.add(player);
//            System.out.println("Player info:  "+playerInfo);
//            int positionIndex = getPositionIndex(playerInfo);
//            if(pos)
//            String playerName = playerInfo.substring(0,positionIndex).trim();
//            players.add(playerName);
//            System.out.println("Found player: "+playerName);
            
        }
        System.out.println("Total of "+players.size()+" players");
        return players;
    }
    
    public void writeToES(Player player) throws IOException {
        
        
        IndexRequest request = new IndexRequest(Constants.PLAYER_LIST_INDEX_NAME, Constants.PLAYER_DOCUMENT_TYPE, player.getName()+"_"+player.getPosition()+"_"+player.getTeam());
        Map<String, Object> jsonMap = new HashMap<>();
        jsonMap.put("name",player.getName());
        jsonMap.put("position", player.getPosition());
        jsonMap.put("team",player.getTeam());       
        request.source(jsonMap);
        client.index(request, RequestOptions.DEFAULT);
    }
    
    public void indexPlayers() throws Exception{
        
        List<Player> players = getPlayers();
        for(Player player: players){
            System.out.println("Indexing: "+player.getName());
            writeToES(player);
        }
        
        client.close();
    }
    
    private void createPlayerIndex() throws Exception {
        if(esConfig.getHost().equalsIgnoreCase("localhost")){
        client = new RestHighLevelClient(
                RestClient.builder(
                        new HttpHost(esConfig.getHost(), 9200, "http"),
                        new HttpHost(esConfig.getHost(), 9201, "http")));
        } else {
            client = ElasticsearchServiceUtil.esClient(esConfig.getHost(), "us-west-2", new DefaultAWSCredentialsProviderChain());
        }

        try {
            //create index for podcasts, two document types
            //One document type for podcast text
            //Second one for player clips
            CreateIndexRequest createPlayerListIndexRequest = new CreateIndexRequest(Constants.PLAYER_LIST_INDEX_NAME);
            createPlayerListIndexRequest.settings(Settings.builder()
                    .put("index.number_of_shards", 3)
                    .put("index.number_of_replicas", 2)
            );
            Map playerListMappings = mapper.readValue(this.getClass().getResourceAsStream("/playersearch.text.mappings.json"), Map.class);
            createPlayerListIndexRequest.mapping(Constants.PLAYER_DOCUMENT_TYPE, playerListMappings);

            client.indices().create(createPlayerListIndexRequest, RequestOptions.DEFAULT);
        } catch (ElasticsearchStatusException status) {
            System.out.println("Error creating podcast text index, Hopefully this is index already exists...");
//            System.out.println("Message: " + status.getDetailedMessage());
            status.printStackTrace();
        } catch (Exception e) {
            System.out.println("Other exception creating podcast text index");
            e.printStackTrace();
        }
        
        
      
    }
    
    
    
    public static void main(String[] args) throws Exception {
        ElasticsearchConfig config = new ElasticsearchConfig();
        config.setHost("https://search-ff-pods-public-vv3efpstye2a2lvyj72jjznxqm.us-west-2.es.amazonaws.com");
        PlayerParser parser = new PlayerParser(config);
        parser.createPlayerIndex();
        parser.indexPlayers();
    }
}
