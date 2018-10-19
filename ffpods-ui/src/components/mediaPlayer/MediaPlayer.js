import React, { Component } from 'react';
import { Media, Player, controls } from 'react-media-player';
import { withMediaProps } from 'react-media-player'
import './MediaPlayer.css';
import ReactGA from 'react-ga';
import { TwitterShareButton,TwitterIcon } from 'react-share'
ReactGA.initialize('UA-126876930-1');

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
            hasPlayedTrack: false,
            nextOnClipEnd: true,
            apiHost: this.props.apiHost
        }
    }

    // shouldComponentUpdate({ media }) {
    //     console.log('Shoudl component update',media);
    //     return this.props.media.isPlaying !== media.isPlaying;
    //   }

    componentDidUpdate(prevProps) {
        // console.log("Component did update",prevProps);
        console.log("Current time: " + this.props.media.currentTime + " isLoading: " + this.props.media.isLoading + " isPlaying: " + this.props.media.isPlaying, this.state);
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
                    this.setState({ seekTime: null })
                }
            } else if (this.state.wasPlaying) {
                console.log("Was playing, starting it up again");
                this.props.media.play();
                this.setState({ wasPlaying: false });
            }
        } else {
            if (this.props.media.currentTime > (this.props.currentTrack.clipEndTime)) {
                if (this.state.nextOnClipEnd) {
                    console.log("After clip end time. Going to next track");
                    this._handleNextTrack();
                }
            }
        }

    }

    _toggleShowClipText = () => {
        this.setState({ showTrackText: !this.state.showTrackText });
    }
    _handlePlayPause = () => {
        this.props.media.playPause();
        var action = this.props.media.isPlaying ? 'Play' : 'Pause';
        ReactGA.event({
            category: 'Football',
            action: action
        });
    }
    _handlePrevTrack = (e) => {
        console.log("MediaPlayer handlePrevTrack()");
        ReactGA.event({
            category: 'Football',
            action: 'PrevTrack'
        });
        this.props.handlePrevTrack();
    }
    _handleNextTrack = (e) => {
        console.log("MediaPlayer handleNextTrack()");
        ReactGA.event({
            category: 'Football',
            action: 'NextTrack'
        });
        this.props.handleNextTrack();
    }
    _handleTrackClick = (e) => {
        console.log("Track click", e);
        ReactGA.event({
            category: 'Football',
            action: 'SelectTrack'
        });
        this.props.handleSelectTrack(e);
    }

    _handleLinkClick = (track) => {
        console.log("Link click of track", track);

        var location = window.location.protocol + "//" + window.location.hostname;
        if (window.location.hostname.indexOf('localhost') >= 0) {
            location = 'https://www.ffpodcastsearch.com';
        }
        var linkToShortern = location + '/football?clipId=' + track.id;
        console.log("Shortening location", linkToShortern);
        var body = { url: linkToShortern }
        fetch(this.props.apiHost + 'getLink', {
            method: 'POST', body: JSON.stringify(body), headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            return response.json();
        }).then(function (response) {
            console.log("Search Response", response);
            alert('Link to share: ' + response.url);
        });
    }

    render() {
        return (

            <div className="media-player-wrapper">
                <div className="media-player">
                    <div className="media-controls media-controls--full">
                        <div classame="media-row">
                            <span className={this.props.media.isLoading ? "" : "hidden"}>Loading<i className="fas fa-spinner fa-spin" /></span>
                        </div>
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
                                <label> <input type="checkbox" checked={this.state.nextOnClipEnd} onChange={() => { this.setState({ nextOnClipEnd: !this.state.nextOnClipEnd }) }} />Auto Play on Clip End</label>
                            </div>
                        </div>
                        <div className="media-control-group">
                            <PrevTrack className="media-control media-control--prev-track" onClick={this._handlePrevTrack} />
                            <PlayPause className="media-control media-control--play-pause" onClick={this._handlePlayPause} />
                            <NextTrack className="media-control media-control--next-track" onClick={this._handleNextTrack} />
                        </div>

                    </div>
                    <Player src={this.props.currentTrack.src} />
                </div>
                <div className="media-row">
                    <div className="media-control-group">

                    </div>
                </div>
                <div className="media-row">
                    <div className="media-playlist">
                        <div className='clipText'>
                            {/* <button className={this.state.showTrackText ? 'hidden' : ''} onClick={this._toggleShowClipText}>Show Clip Text</button>
                            <button className={this.state.showTrackText ? '' : 'hidden'} onClick={this._toggleShowClipText}>Hide Clip Text</button> */}
                        </div>
                        <p className={this.state.showTrackText ? 'clipText' : 'hidden'} dangerouslySetInnerHTML={{ __html: this.props.currentTrack.text }}></p>
                    </div>
                </div>
                <aside className="media-playlist">
                    <header className="media-playlist-header">
                        <h3 className="media-playlist-title">Playlist</h3>
                    </header>
                    <table className="media-playlist-tracks">
                        <tbody>
                            {this.props.tracks.map((track, i) =>
                                <tr key={track.label + "_" + i}   >
                                    <td><a href={track.podcastLink} target="_blank"><img width="128" src={track.podcastImage} /></a></td>
                                    <td className={`media-playlist-track ${track === this.props.currentTrack ? 'is-active' : ''}`}
                                        onClick={this._handleTrackClick.bind(this, track)}>{track.startTime}</td>
                                    <td className={`media-playlist-track ${track === this.props.currentTrack ? 'is-active' : ''}`}
                                        onClick={this._handleTrackClick.bind(this, track)}>{track.player}</td>
                                    <td className={`media-playlist-track ${track === this.props.currentTrack ? 'is-active' : ''}`}
                                        onClick={this._handleTrackClick.bind(this, track)}>{track.episodeTitle}</td>
                                    <td className={`media-playlist-track ${track === this.props.currentTrack ? 'is-active' : ''}`}
                                        onClick={this._handleTrackClick.bind(this, track)}>{track.publishDate.toLocaleDateString()}</td>
                                    <td className="media-playlist-track"> 
                                        <i className="fas fa-link" onClick={this._handleLinkClick.bind(this, track)}></i>                                       
                                        <TwitterShareButton
                                            url={"https://www.ffpodcastsearch.com/football?clipId="+encodeURIComponent(track.id)}
                                            title={"Check out this clip about "+track.player+" by "+track.podcast}
                                            className="Demo__some-network__share-button">
                                            <TwitterIcon
                                                size={32}
                                                round />
                                        </TwitterShareButton>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </aside>
            </div>


        )
    }
}

export default withMediaProps(MediaPlayer);