import React, { Component, Fragment } from 'react';
import './Search.css';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'react-bootstrap-typeahead/css/Typeahead-bs4.css';

class Search extends Component {
    constructor(props) {
        super(props);
        this.state = {
            options: [],
            isLoading: false,
            players: []
        }
    }
    _handleSearch = (e) => {
        console.log("Search Event", e);
        this.setState({ isLoading: true });
        var search = this;
        fetch('https://jrgrhzrkpb.execute-api.us-west-2.amazonaws.com/prod/playerSearch?name=' + e)
            .then(function (response) {
                return response.json();
            }).then(function (response) {
                console.log("Search Response", response);
                var retList = [];
                for (var i = 0; i < response.length; i++) {
                    retList.push(response[i]._source.name.trim());
                }
                console.log("search return list: ", retList);
                search.setState({ options: retList, isLoading: false })
            });
    }
    _typeAheadChange = (e) => {
        console.log("Type ahead hance", e);                
        this.setState({ players: e });
    }

    _handleBuildPlayList = (e) => {
        console.log("Building play list");
        var body = { players: this.state.players };
        console.log("Sending body", body);
        var searchComponent = this;
        fetch('https://jrgrhzrkpb.execute-api.us-west-2.amazonaws.com/prod/playerClips', {
            method: 'POST', body: JSON.stringify(body), headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(function (response) {
                return response.json();
            }).then(function (response) {
                console.log("Search Response", response);
                searchComponent.props.handleBuildPlayList(response);
            });
    }

    render() {
        return (
            <div >
                <AsyncTypeahead
                    multiple={true}
                    labelKey="name"
                    isLoading={this.state.isLoading}
                    options={this.state.options}
                    placeholder="Enter a player..."
                    onSearch={this._handleSearch}
                    onChange={this._typeAheadChange}

                />
                <div>
                    <h4>Players</h4>
                    <ul>
                        {this.state.players.map(function (value) {
                            return <li key={value} >{value}</li>;
                        })}
                    </ul>
                    <button onClick={this._handleBuildPlayList}>Build Play List</button>
                </div>
                <div>
                    
                </div>
            </div>

        );
    }
}

export default Search;
