/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.ffpods.podcastindex;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 *
 * @author jwalton
 */
public class PlayerParser {
    //not really a csv
    private final String file = "/players.csv";
    
    private Integer getPositionIndex(String playerInfo){
        
        Set<String> positions = new HashSet<>(Arrays.asList(" RB ", " QB ", " WR ", " TE " ));
        int positionIndex = -1;
        for(String position : positions){
            positionIndex = playerInfo.indexOf(position);
            if(positionIndex >= 0){
                break;
            }
        }
        return positionIndex;
    }
    
    public List<String> getPlayers() throws Exception{
        BufferedReader br = new BufferedReader(new InputStreamReader(this.getClass().getResourceAsStream(file)));
        String line = null;
        List<String> players = new ArrayList<>();
        while((line = br.readLine()) != null){
            int indexOfPeriod = line.indexOf(".");
             if(indexOfPeriod < 0){
                continue;
            }
            String playerInfo = line.substring(indexOfPeriod+1);
            String[] playerInfoSplit = playerInfo.split("\t");
            System.out.println("Name: "+playerInfoSplit[0]);;
            players.add(playerInfoSplit[0]);
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
    
    public static void main(String[] args) throws Exception {
        PlayerParser parser = new PlayerParser();
        parser.getPlayers();
    }
}
