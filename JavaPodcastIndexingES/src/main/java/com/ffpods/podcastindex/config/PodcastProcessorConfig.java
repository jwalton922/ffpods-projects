/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.ffpods.podcastindex.config;

/**
 *
 * @author jwalton
 */
public class PodcastProcessorConfig {
    private String audioRootFolder;
    private String textRootFolder;
    //after clips made and stored locally, they are uploaded to S3
    private String s3OutputBucket;
    private String s3OutputKeyPrefix;
    //ffmpeg writes clips locally, later in processing, get uploaded to s3
    private String localOutputDir;

    public String getS3OutputBucket() {
        return s3OutputBucket;
    }

    public void setS3OutputBucket(String s3OutputBucket) {
        this.s3OutputBucket = s3OutputBucket;
    }

    public String getS3OutputKeyPrefix() {
        return s3OutputKeyPrefix;
    }

    public void setS3OutputKeyPrefix(String s3OutputKeyPrefix) {
        this.s3OutputKeyPrefix = s3OutputKeyPrefix;
    }

    

    public String getLocalOutputDir() {
        return localOutputDir;
    }

    public void setLocalOutputDir(String localOutputDir) {
        this.localOutputDir = localOutputDir;
    }
    


    public String getAudioRootFolder() {
        return audioRootFolder;
    }

    public void setAudioRootFolder(String audioRootFolder) {
        this.audioRootFolder = audioRootFolder;
    }

    public String getTextRootFolder() {
        return textRootFolder;
    }

    public void setTextRootFolder(String textRootFolder) {
        this.textRootFolder = textRootFolder;
    }
    
    
}
