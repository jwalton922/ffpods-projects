import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import NavBar from './NavBar';
import Search from './components/search/Search.js';
import MediaPlayer from './components/mediaPlayer/MediaPlayer.js';
import { Media, utils } from 'react-media-player';
import ReactGA from 'react-ga';
ReactGA.initialize('UA-126876930-1');
const { formatTime } = utils
class App extends Component {
  constructor(props) {
    super(props);
    // var api_host = 'http://localhost:3001/';
    var api_host = 'https://jrgrhzrkpb.execute-api.us-west-2.amazonaws.com/prod/';
    this.state = {
      currentTrack: { src: "" },
      tracks: [],
      playerClips: [],
      apiHost: api_host,
      showSearchResults: false
    }
  }

  _findCurrentTrackIndex = () => {
    var currentIndex = -1;
    for (var i = 0; i < this.state.tracks.length; i++) {
      var track = this.state.tracks[i];
      if (track.src === this.state.currentTrack.src) {
        currentIndex = i;
        break;
      }
    }
    return currentIndex;
  }
  _setTrackToIndex = (index) => {
    var trackToSet = { src: "", label: "" }
    if (index < 0) {
      //no match      
      this.setState({ currentTrack: trackToSet });
      return;
    }
    if (index >= this.state.tracks.length) {
      //end of play list
      this.setState({ currentTrack: trackToSet });
    } else if (index < 0) {
      //hitting previous at first track
      this.setState({ currentTrack: trackToSet });
    } else {
      this.setState({ currentTrack: this.state.tracks[index] });
    }
  }
  _handleNextTrack = (e) => {
    var currentIndex = this._findCurrentTrackIndex();
    console.log("App.js Handle next track, think current index is: ", currentIndex);
    var indexToPlay = currentIndex + 1;
    this._setTrackToIndex(indexToPlay);
  }

  _handlePrevTrack = (e) => {
    var currentIndex = this._findCurrentTrackIndex();
    console.log("App.sj Handle prev track, think current index is: ", currentIndex);
    var indexToPlay = currentIndex - 1;
    this._setTrackToIndex(indexToPlay);
  }
  _handleSelectTrack = (track) => {
    this.setState({ currentTrack: track });
  }
  _handleBuildPlayList = (clips) => {
    this.setState({ showSearchResults: true });
    console.log("Handle build play list called with clips", clips);
    var tracks = [];
    for (var i = 0; i < clips.length; i++) {
      var clip = clips[i];
      var startTime = formatTime(clip._source.clipStartTime);
      var label = startTime + ": " + clip._source.player + " " + clip._source.podcast + " " + clip._source.episodeTitle;
      var track = { src: clip._source.clipUrl, label: label, text: clip._source.clipText, id: clip._id };
      track.player = clip._source.player;
      track.clipStartTime = clip._source.clipStartTime;
      track.clipEndfTime = clip._source.clipEndTime;
      track.podcastImage = clip._source.image;
      track.publishDate = new Date(clip._source.publishDate);
      track.startTime = startTime;
      track.episodeTitle = clip._source.episodeTitle;
      track.podcast = clip._source.podcast;
      var player = clip._source.player;
      track.text = track.text.replace(clip._source.player, "<b>" + clip._source.player + "</b>");
      tracks.push(track);
    }
    console.log("Tracks ", tracks);
    var currentTrack = tracks.length > 0 ? tracks[0] : { src: "", label: "" };

    this.setState({ tracks: tracks, currentTrack: currentTrack });
  }
  render() {
    return (
      <div className="App">
        <Search handleBuildPlayList={this._handleBuildPlayList} location={this.props.location} apiHost={this.state.apiHost} />
        <div className={this.state.showSearchResults ? 'row' : 'row hidden'}>
          <div className="col-sm-10">
            <h4>Search Results: {this.state.tracks.length}</h4>
          </div>
        </div>
        <div className={this.state.showSearchResults ? '' : 'hidden'}>
          <Media>
            <MediaPlayer
              tracks={this.state.tracks}
              currentTime={this.state.currentTrack.clipStartTime}
              currentTrack={this.state.currentTrack}
              handleSelectTrack={this._handleSelectTrack}
              handlePrevTrack={this._handlePrevTrack}
              handleNextTrack={this._handleNextTrack}
              apiHost={this.state.apiHost}
            />
          </Media>
        </div>
      </div>
    );
  }
}

export default App;
