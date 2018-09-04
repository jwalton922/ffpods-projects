/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.ffpods.podcastindex;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

/**
 *
 * @author jwalton
 */
public class Utils {
    public static Integer getTimeInSeconds(String startTime){      
        String[] split = startTime.split(":");
        int time = 0;
        List<Integer> multipliers = Arrays.asList(1,60,3600);
        int multiplierIndex = 0;
        for(int index = split.length - 1; index >= 0; index--){
            Integer multiplier = multipliers.get(multiplierIndex);
            multiplierIndex++;
            String integerString = split[index].trim();
            if(integerString.length() > 1 && integerString.startsWith("0")){
                integerString = integerString.substring(1);
            }
            Integer digits = Integer.parseInt(integerString);
            time+=digits*multiplier;
        }
        
        return time;
    }
}
