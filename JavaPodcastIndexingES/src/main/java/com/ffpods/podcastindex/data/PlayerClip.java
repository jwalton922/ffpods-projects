/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.ffpods.podcastindex.data;

/**
 *
 * @author jwalton
 */
public class PlayerClip {
    String podcast;
    String episodeTitle;
    Integer clipStartTime;
    Integer clipEndTime;
    String clipText;
    String player;
    String id;
    String s3Location;

    public String getS3Location() {
        return s3Location;
    }

    public void setS3Location(String s3Location) {
        this.s3Location = s3Location;
    }
    
    
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
    
    
    public String getPodcast() {
        return podcast;
    }

    public void setPodcast(String podcast) {
        this.podcast = podcast;
    }

    public String getEpisodeTitle() {
        return episodeTitle;
    }

    public void setEpisodeTitle(String episodeTile) {
        this.episodeTitle = episodeTile;
    }

    public Integer getClipStartTime() {
        return clipStartTime;
    }

    public void setClipStartTime(Integer clipStartTime) {
        this.clipStartTime = clipStartTime;
    }

    public Integer getClipEndTime() {
        return clipEndTime;
    }

    public void setClipEndTime(Integer clipEndTime) {
        this.clipEndTime = clipEndTime;
    }

    public String getClipText() {
        return clipText;
    }

    public void setClipText(String clipText) {
        this.clipText = clipText;
    }

    public String getPlayer() {
        return player;
    }

    public void setPlayer(String player) {
        this.player = player;
    }
    
    
}
