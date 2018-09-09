import React, { Component } from 'react';
import { Media, Player, controls } from 'react-media-player';
import './main.css';
import InputRange from 'react-input-range';
import 'react-input-range/lib/css/index.css';
import PlayerClip from './PlayerClip.js';
import { withMediaProps } from 'react-media-player'
const {PlayPause, MuteUnmute, CurrentTime, Progress, SeekBar, Duration, Volume, Fullscreen} = controls;

console.debug("Media Player?");
class MediaPlayer extends Component {
    constructor(props) {
        super(props);
        console.log("constructor in media player",{});
        
        this.state = {

            players: [             
            ]
        }
    }

    componentDidMount(e) {
        console.log("Component did mount");     
        var component = this;
         fetch('http://localhost:3001/playerClips')
                .then(function (response) {
                    console.log("Resposne",response);
                    return response.json();
                }).then(function (response) {
                    console.log("Response2",response);
                    for(var i = 0; i < response.length; i++){
                        response[i].value = {min: response[i]._source.clipStartTime, max: response[i]._source.clipEndTime};
                        response[i].name = response[i]._source.player;
                        for(var key in response[i]._source){
                            response[i][key]=response[i]._source[key];
                        }
                    }
                    response.sort(function(a,b){
                        var aValue = a.value.min;
                        var bValue = b.value.min;
                        if(aValue < bValue){
                            return -1;
                        } else if(aValue > bValue){
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                    console.log("Modified response",response);
                    component.setState({players:response});
                });
    }
    
    componentDidUpdate(a,b) {
        console.log("Component did update",a,b);
       

    }

    handleInputRangeChange(index, value) {
        console.log("Changing index", index, value);
        console.log("Updated te index too",index);
        //this is bad to do in react but...
        this.state.players[index].value = value;
        this.setState({player: this.state.players});
    }
    //cut this from render method, it's the InputRange with min and max method
    // {this.state.players.map((player, i) =>
    //     <div key={i} className="media-control-group media-control-group--seek">                                                                                                                                                                       
    //         <h5 className="player-name">{player.name} {i}</h5>
    //         <InputRange                                               
    //             maxValue={3639}
    //             minValue={0}
    //             value={player.value}
    //             onChange={value => this.handleInputRangeChange(i, value)}
    //             />
    //     </div>


    //         )}
    render() {
        return (
                <Media>
                    <div className="media-player-wrapper">
                        <div className="media-player">
                            <div className="media-controls media-controls--full">
                                <div className="media-row">
                                    <CurrentTime className="media-control media-control--current-time"/>
                                    Current file?
                                    <Duration className="media-control media-control--duration"/>
                                </div>
                                <div className="media-control-group media-control-group--seek">
                                    <Progress className="media-control media-control--progress"/>
                                    <SeekBar className="media-control media-control--seek"/>
                                </div>
                                <div className="media-row">
                                    <div className="media-control-group">
                                        <PlayPause className="media-control media-control--play-pause"/>                                   
                                        <MuteUnmute className="media-control media-control--mute-unmute"/>
                                        <Volume className="media-control media-control--volume"/>
                                    </div>
                                </div>
                               
                
                                {this.state.players.map((player, i) =>
                                        <div key={i} className="media-control-group media-control-group--seek">                                                                                                                                                                                                                  
                                            <PlayerClip name={player.name} startTime={player.clipStartTime} endTime={player.clipEndTime} /> 
                                        </div>


                                            )}
                                
                
                            </div>
                            <Player src="https://s3-us-west-2.amazonaws.com/josh-audio-test/goodVibes.m4a" />
                        </div>
                    </div>
                
                </Media>
                )
    }
}

export default withMediaProps(MediaPlayer);
