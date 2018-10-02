import React, { Component } from 'react';
import { Media, Player, controls } from 'react-media-player';
import { withMediaProps } from 'react-media-player'
import './MediaPlayer.css';
const { PlayPause, MuteUnmute, CurrentTime, Progress, SeekBar, Duration, Volume, Fullscreen } = controls;
const PrevTrack = (props) => (
    <svg width="10px" height="12px" viewBox="0 0 10 12" {...props}>
        <polygon fill="#FAFBFB" points="10,0 2,4.8 2,0 0,0 0,12 2,12 2,7.2 10,12" />
    </svg>
)

const NextTrack = (props) => (
    <svg width="10px" height="12px" viewBox="0 0 10 12" {...props}>
        <polygon fill="#FAFBFB" points="8,0 8,4.8 0,0 0,12 8,7.2 8,12 10,12 10,0" />
    </svg>
)
class MediaPlayer extends Component {
    constructor(props) {
        super(props);
        console.log("constructor in media player", props);
        this.state = {
            showTrackText: true,
            seekTime: null,
            wasPlaying: false,
            hasPlayedTrack: false
        }
    }

    // shouldComponentUpdate({ media }) {
    //     console.log('Shoudl component update',media);
    //     return this.props.media.isPlaying !== media.isPlaying;
    //   }

    componentDidUpdate(prevProps) {
        // console.log("Component did update",prevProps);
        console.log("Current time: "+ this.props.media.currentTime+" isLoading: "+this.props.media.isLoading+" isPlaying: "+this.props.media.isPlaying,this.state);
        // console.log("isLoading?" + this.props.media.isLoading);
        if (prevProps.currentTrack.id !== this.props.currentTrack.id) {
            this.setState({ wasPlaying: prevProps.media.isPlaying });
            //if still loading, wait to seek until track is loaded
            if (this.props.media.isLoading) {
                this.setState({ seekTime: clipStart });
                return;
            }
            console.log("New track");
            var clipStart = this.props.currentTrack.clipStartTime;
            console.log("Trying to set time: " + clipStart);
            if (this.props.media) {
                console.log("Seeking");
                this.props.media.seekTo(clipStart);
                this.setState({ seekTime: clipStart });
            } else {
                console.log("media not a property?");
            }
        } else if (this.state.seekTime && !this.props.media.isLoading) {
            console.log("seekTime set and not is loading");
            //finished loading
            //if playing seek
            if (this.props.media.isPlaying) {
                console.log("is playing. Will see if i need to seek");
                var delta = Math.abs(this.props.media.currentTime - this.state.seekTime);
                console.log("Delta: " + delta);
                if (delta > 1) {
                    this.props.media.seekTo(this.state.seekTime);
                    this.setState({seekTime: null})
                }                 
            } else if(this.state.wasPlaying){
                console.log("Was playing, starting it up again");
                this.props.media.play();
                this.setState({wasPlaying: false});
            }
        }

    }

    _toggleShowClipText = () => {
        this.setState({ showTrackText: !this.state.showTrackText });
    }
    _handlePrevTrack = (e) => {
        console.log("MediaPlayer handlePrevTrack()");
        this.props.handlePrevTrack();
    }
    _handleNextTrack = (e) => {
        console.log("MediaPlayer handleNextTrack()");
        this.props.handleNextTrack();
    }
    _handleTrackClick = (e) => {
        console.log("Track click", e);
        this.props.handleSelectTrack(e);
    }
    render() {
        return (

            <div className="media-player-wrapper">
                <div className="media-player">
                    <div className="media-controls media-controls--full">
                        <div className="media-row">
                            <CurrentTime className="media-control media-control--current-time" />
                            {this.props.currentTrack.label}
                            <Duration className="media-control media-control--duration" />
                        </div>
                        <div className="media-control-group media-control-group--seek">
                            <Progress className="media-control media-control--progress" />
                            <SeekBar className="media-control media-control--seek" />
                        </div>
                        <div className="media-row">
                            <div className="media-control-group">
                                <MuteUnmute className="media-control media-control--mute-unmute" />
                                <Volume className="media-control media-control--volume" />
                            </div>
                        </div>
                        <div className="media-control-group">
                            <PrevTrack className="media-control media-control--prev-track" onClick={this._handlePrevTrack} />
                            <PlayPause className="media-control media-control--play-pause" />
                            <NextTrack className="media-control media-control--next-track" onClick={this._handleNextTrack} />
                        </div>

                    </div>
                    <Player src={this.props.currentTrack.src} />
                </div>
                <div className="media-row">
                    <div className="media-control-group">
                        <button className={this.state.showTrackText ? 'hidden' : ''} onClick={this._toggleShowClipText}>Show Clip Text</button>
                        <button className={this.state.showTrackText ? '' : 'hidden'} onClick={this._toggleShowClipText}>Hide Clip Text</button>
                    </div>
                </div>
                <div className="media-row">
                    <div className="media-playlist">
                        <p className={this.state.showTrackText ? 'media-playlist-tracks' : 'hidden'} dangerouslySetInnerHTML={{ __html: this.props.currentTrack.text }}></p>
                    </div>
                </div>
                <aside className="media-playlist">
                    <header className="media-playlist-header">
                        <h3 className="media-playlist-title">Playlist</h3>
                    </header>
                    <ul className="media-playlist-tracks">
                        {this.props.tracks.map((track, i) =>
                            <li
                                key={track.label + "_" + i}
                                className={`media-playlist-track ${track === this.props.currentTrack ? 'is-active' : ''}`}
                                onClick={this._handleTrackClick.bind(this, track)}
                            >
                                {track.label}
                            </li>
                        )}

                    </ul>
                </aside>
            </div>


        )
    }
}

export default withMediaProps(MediaPlayer);