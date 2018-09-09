import React, { Component } from 'react';
class TimeStamp extends Component {
    constructor(props) {
        super(props);
        console.log("constructor intimestamp",props);
        var hours = Math.floor(props.time/3600);
        var leftOver = props.time-(3600*hours);
        var minutes = Math.floor(leftOver/60);
        leftOver = leftOver-(minutes*60);
        var seconds = leftOver;
        this.state = {
            hours: hours,
            minutes: minutes,
            seconds: seconds
        }
    }
  render() {
    return (
      <span >
      <input type="number" min="0" max="24" value={this.state.hours} />
      <label>:</label><input type="number" min="0" max="60" value={this.state.minutes} />
      <label>:</label><input type="number" min="0" max="60" value={this.state.seconds} />
      </span>
    );
  }
}

export default TimeStamp;

