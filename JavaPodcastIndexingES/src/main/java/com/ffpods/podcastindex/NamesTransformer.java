/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.ffpods.podcastindex;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 *
 * @author jwalton
 */
public class NamesTransformer {
    
    public static void main(String[] args) throws Exception {
        String file = "/Users/jwalton/Downloads/names.txt";
        PrintWriter pw = new PrintWriter("/Users/jwalton/Downloads/names.json");
        BufferedReader br = new BufferedReader(new FileReader(file));
        ObjectMapper mapper = new ObjectMapper();
        String line = null;
        List<String> outputValues = new ArrayList<>();
        while((line = br.readLine()) != null){
//            System.out.println("Line: "+line);
            Map<String,Object> outputMap = new HashMap<>();
            outputMap.put("term", line);
            String name = line.replace("-", " ");
            if(name.equals("A.J.")){
                name = "A.J. Green";
            } else if(name.equals("C.J.")){
                name = "C.J. Anderson";
            } else if(name.equals("T.Y.")){
                name = "T.Y. Hilton";
            } else if(name.equals("T.J.")){
                name = "T.J. Yeldon";
            } else if(name.equals("O.J.")){
                name = "O.J. Howard";
            }
            outputMap.put("name", name);
            System.out.println("Output: "+mapper.writeValueAsString(outputMap));
            outputValues.add(mapper.writeValueAsString(outputMap));
        }
        pw.println("[");
        for(int i = 0; i < outputValues.size()-1;i++){
            pw.println(outputValues.get(i)+",");
            pw.flush();
        }
        pw.println(outputValues.get(outputValues.size()-1));
        pw.println("]");
            pw.flush();
        pw.close();
        
    }
}
