import React, { Component } from 'react';
import { Media, Player, controls } from 'react-media-player';
import './main.css';
import InputRange from 'react-input-range';
import 'react-input-range/lib/css/index.css';
const {PlayPause, MuteUnmute, CurrentTime, Progress, SeekBar, Duration, Volume, Fullscreen} = controls;
console.debug("Media Player?");
class MediaPlayer extends Component {
    constructor(props) {
        super(props);
        console.log("constructor in media player",{});
        
        this.state = {

            players: [
                {
                    name: "Andrew Luck",
                    value: {min: 835, max: 870}
                },
                {
                    name: "Andrew Luck",
                    value: {min: 643, max: 675}
                },
                {
                    name: "Julio Jones",
                    value: {min: 2875, max: 2910}
                },
                {
                    name: "Rashaad Penny",
                    value: {min: 130, max: 190}
                }
            ]
        }
    }

    componentDidMount(e) {
        console.log("Component did mount");       
         fetch('http://localhost:3001/playerClips')
                .then(function (response) {
                    console.log("Resposne",response);
                    return response.json();
                }).then(function (response) {
                    console.log("Response2",response);
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
                
                                {this.state.players.map((player, i) =>
                                        <div key={i} className="media-control-group media-control-group--seek">                                                                                                                                                                       
                                            <h5 className="player-name">{player.name} {i}</h5>
                                            <InputRange                                               
                                                maxValue={3639}
                                                minValue={0}
                                                value={player.value}
                                                onChange={value => this.handleInputRangeChange(i, value)}
                                                />
                                        </div>


                                            )}
                
                
                                <div className="media-row">
                                    <div className="media-control-group">
                                        <PlayPause className="media-control media-control--play-pause"/>                                   
                                        <MuteUnmute className="media-control media-control--mute-unmute"/>
                                        <Volume className="media-control media-control--volume"/>
                                    </div>
                                </div>
                
                            </div>
                            <Player src="https://s3-us-west-2.amazonaws.com/josh-audio-test/goodVibes.m4a" />
                        </div>
                    </div>
                
                </Media>
                )
    }
}

export default MediaPlayer;
