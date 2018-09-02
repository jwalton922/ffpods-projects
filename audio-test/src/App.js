import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import MediaPlayer from './MediaPlayer';
class App extends Component {
  render() {
    return (
      <div className="App">
        <MediaPlayer />
      </div>
    );
  }
}

export default App;
