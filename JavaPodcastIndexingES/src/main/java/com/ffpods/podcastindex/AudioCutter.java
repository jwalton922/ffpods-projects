/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.ffpods.podcastindex;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/**
 *
 * @author jwalton
 */
public class AudioCutter {
    private static String audioFile = "/Users/jwalton/podcasts/fantasyFootballers/goodVibes.m4a";
    private static String ffmpegExecutable = "/Users/jwalton/Downloads/ffmpeg-20180825-844ff49-macos64-static/bin/ffmpeg";
    private static String outputDir = "/Users/jwalton/workspace/audio-test/src/audioFiles/";

    
    public static void main(String[] args){
        getStartTimeString(2962);
    }
    private static String getStartTimeString(int startTime) {
        int timeLeft = startTime;
        int hours = (int)(startTime / 3600.0);
        timeLeft = timeLeft - (3600 * hours);
        int minutes = (int)(timeLeft / 60.0);
        timeLeft = timeLeft - (minutes * 60);
        int seconds = timeLeft;

        String timeString = "";
        String hoursString = "" + hours;
        String minutesString = "" + minutes;
        String secondsSring = "" + seconds;

        if (hoursString.length() < 2) {
            hoursString = "0" + hoursString;
        }
        if (minutesString.length() < 2) {
            minutesString = "0" + minutesString;
        }
        if (secondsSring.length() < 2) {
            secondsSring = "0" + secondsSring;
        }

        return hoursString + ":" + minutesString + ":" + secondsSring;
    }

    private static class StreamGobbler implements Runnable {

        private InputStream inputStream;
        private Consumer<String> consumer;

        public StreamGobbler(InputStream inputStream, Consumer<String> consumer) {
            this.inputStream = inputStream;
            this.consumer = consumer;
        }

        @Override
        public void run() {
            new BufferedReader(new InputStreamReader(inputStream)).lines()
                    .forEach(consumer);
        }
    }

    public static void cutFile(Integer startTimeInSeconds, int duration, String podcastAudioFile, String outputFile) throws Exception {
        ProcessBuilder builder = new ProcessBuilder();

//        int duration = endSeconds - startSeconds;
        String startTime = getStartTimeString(startTimeInSeconds);
        
        System.out.println("Start time: " + startTime +" output file: "+outputFile);
        
        builder.command(ffmpegExecutable, "-ss", startTime,"-i", podcastAudioFile, "-vn", "-c", "copy", "-t", "" + duration,outputFile, "-nostdin" );
        Process process = builder.start();
        StreamGobbler streamGobbler
                = new StreamGobbler(process.getInputStream(), System.out::println);
        StreamGobbler streamGobbler2
                = new StreamGobbler(process.getErrorStream(), System.out::println);
                
        ExecutorService es = Executors.newSingleThreadExecutor();
        es.submit(streamGobbler);
        es.submit(streamGobbler2);
        boolean complete = process.waitFor(60L, TimeUnit.SECONDS);
        System.out.println("Completed? "+complete);
        es.shutdown();
        es.awaitTermination(60, TimeUnit.SECONDS);
        while(!es.isTerminated()){
            System.out.println("Not terminated");
            try {
                Thread.sleep(200);
            } catch(Exception e){
            }
        }
        
//        if(exitCode > 0){
//            throw  new RuntimeException("Error cutting file. See above");
//        }
    }
}
