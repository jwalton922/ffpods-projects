import React, { Component } from 'react';
import TimeStamp from './TimeStamp.js';
import { withMediaProps } from 'react-media-player'
class PlayerClip extends Component {
    constructor(props) {
        super(props);
        console.log("constructor in player clip", props);
        
        this.state = {
            startTime: props.startTime,
            endTime: props.endTime,
            name: props.name,
            props: props
        }
    }
    handlePlayClip = () => {
        console.log("Handle play click",this);
        
        this.state.props.media.seekTo(this.state.startTime)
    }
    render() {
        return (
                <div>
                    <label>{this.props.name}</label><button onClick={this.handlePlayClip}>Play</button>
                    <label>Start</label><TimeStamp time={this.state.startTime}/>
                    <label>End</label><TimeStamp time={this.state.endTime}/>
                    
                </div>
                );
    }
}

export default withMediaProps(PlayerClip);
