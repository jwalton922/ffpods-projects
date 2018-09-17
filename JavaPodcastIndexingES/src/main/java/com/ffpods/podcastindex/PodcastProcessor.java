/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.ffpods.podcastindex;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.PutObjectResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ffpods.podcastindex.config.PodcastProcessorConfig;
import com.ffpods.podcastindex.data.PlayerClip;
import java.io.File;
import java.io.FileInputStream;
import java.io.FilenameFilter;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Take audio and text files, find clips and create the small audio files, upload them to s3
 * @author jwalton
 */
public class PodcastProcessor {
    
    private PodcastProcessorConfig config;
    private AmazonS3 s3;
    public Map<String,Integer> playerClipCount = new HashMap<>();
    public PodcastProcessor(PodcastProcessorConfig config){
        this.config = config;
        s3 = AmazonS3Client.builder().build();
        if(!this.config.getLocalOutputDir().endsWith("/")){
            this.config.setLocalOutputDir(config.getLocalOutputDir()+"/");
        }
    }
    
    private File findFileWithName(String startsWith, File directory){
                
        File[] matchingFiles = directory.listFiles(new FilenameFilter() {
            @Override
            public boolean accept(File someFile, String name) {
                return name.startsWith(startsWith);
            }
        });
        if(matchingFiles.length > 1){
            throw new RuntimeException("Multiple files matching: "+startsWith+" In directory: "+directory.getName());
        } else if(matchingFiles.length == 0){
            return null;
        } else {
            return matchingFiles[0];
        }
        
    }
    
    public void process() throws Exception {
        File textRootFolder = new File(config.getTextRootFolder());
        File audioRootFolder = new File(config.getAudioRootFolder());
        //root folder should have bunch of folders with podcast names
        File[] allPodcastTextFolders = textRootFolder.listFiles();
        for(int i = 0; i < allPodcastTextFolders.length; i++){
            File podcastTextFolder = allPodcastTextFolders[i];
            
            if(!podcastTextFolder.isDirectory()){
                System.out.println("Skipping "+podcastTextFolder.getName()+" since it is not directory");
                continue;
            }
            String podcastName = podcastTextFolder.getName();
            System.out.println("Processing podcast folder: "+podcastName);
            //look for corresponding audio folder. Assume they have idential structures
            File podcastAudioFolder = findFileWithName(podcastName, audioRootFolder);
            if(podcastAudioFolder == null || !podcastAudioFolder.exists()){
                throw new RuntimeException("Cannot find audio folder for podcast text folder: "+podcastTextFolder.getName()+" in root audio folder: "+audioRootFolder.getAbsolutePath());
            }
            
            File[] podcastEpisodeTextFiles = podcastTextFolder.listFiles();
            for(int j = 0; j < podcastEpisodeTextFiles.length; j++){
                File podcastEpiosdeTextFile = podcastEpisodeTextFiles[j];
                String episodeName = podcastEpiosdeTextFile.getName().substring(0,podcastEpiosdeTextFile.getName().indexOf("."));
                System.out.println("Episode name: "+episodeName);
                File podcastEpisodeAudioFile = findFileWithName(episodeName, podcastAudioFolder);
                if(podcastEpisodeAudioFile == null || ! podcastEpisodeAudioFile.exists()){
                    throw new RuntimeException("No matching audio file for "+podcastName+" episode: "+episodeName);
                }
                processPodcast(podcastName, episodeName, podcastEpiosdeTextFile, podcastEpisodeAudioFile);
                
            } //end loop podcastEpisodeTextFiles
        } //end loop allPodcatTextFolders
    }
    
    public void processPodcast(String podcastName, String episodeName, File textFile, File audioFile) throws Exception {
       PodcastTextIndexer textIndexer = new PodcastTextIndexer();
       InputStream textInputStream = new FileInputStream(textFile);
       //index text into Elasticsearch so we can find clip/segments by searching index by player names
       textIndexer.indexFile(textInputStream, podcastName, episodeName);
       PlayerClipFinder clipFinder = new PlayerClipFinder();
       List<PlayerClip> clips = clipFinder.findPlayerClips(podcastName,episodeName,false);
       int count = 0;
       int total = clips.size();
       System.out.println("Will creat a total of "+total+" clips for "+podcastName+" episode: "+episodeName);
       String s3BucketName = config.getS3OutputBucket();
       
       for(PlayerClip clip : clips){
           count++;
           System.out.println("****************************\n\nCreating clip "+clip.getId()+". "+count+"/"+total);
           String extension = audioFile.getName().substring(audioFile.getName().lastIndexOf(".")+1);
           System.out.println("Extension is "+extension+" from file: "+audioFile.getName());
           String clipOutputFile = config.getLocalOutputDir()+clip.getId()+"."+extension;
           AudioCutter.cutFile(clip.getClipStartTime(), clip.getClipEndTime()-clip.getClipStartTime(), audioFile.getAbsolutePath(), clipOutputFile);
           System.out.println("Finished creating clip "+clip.getId()+"\n\n*************************");
           File clipToUploadToS3 = new File(clipOutputFile);
           String s3Key = config.getS3OutputKeyPrefix()+ clipToUploadToS3.getName();
           clip.setS3Location("https://s3-us-west-2.amazonaws.com/"+s3BucketName+"/"+s3Key);
           clipFinder.writePlayerClip(clip);
           System.out.println("S3 key: "+s3Key);
           PutObjectRequest por = new PutObjectRequest(s3BucketName,s3Key , clipToUploadToS3);
           por.setCannedAcl(CannedAccessControlList.PublicRead);
           PutObjectResult result = s3.putObject(por);
           if(!playerClipCount.containsKey(clip.getPlayer())){
               playerClipCount.put(clip.getPlayer(),1);
           } else {
               int prevValue = playerClipCount.get(clip.getPlayer());
               playerClipCount.put(clip.getPlayer(),prevValue+1);
           }
       }
       textIndexer.shutDown();
       clipFinder.shutdown();
       System.out.println("Finished with podcast processor!");
       
    }
    
    public static void main(String[] args) throws Exception {
        String configFile = "/processorConfig/joshLocalConfig.json";
        ObjectMapper mapper = new ObjectMapper();
        PodcastProcessorConfig config = mapper.readValue(PodcastProcessor.class.getResourceAsStream(configFile), PodcastProcessorConfig.class);
        
        PodcastProcessor processor = new PodcastProcessor(config);
        processor.process();
        for(String player : processor.playerClipCount.keySet()){
            System.out.println("PLayer"+player+" has "+processor.playerClipCount.get(player)+" clips");
        }
    }
}
