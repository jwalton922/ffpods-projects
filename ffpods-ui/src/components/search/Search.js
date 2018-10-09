import React, { Component, Fragment } from 'react';
import './Search.css';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'react-bootstrap-typeahead/css/Typeahead-bs4.css';
import ReactGA from 'react-ga';

ReactGA.initialize('UA-126876930-1');
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}
class Search extends Component {
    constructor(props) {
        super(props);
        this.state = {
            options: [],
            isLoading: false,
            players: []
        }
    }

    _handleSearchResponse = (response) => {

    }
    componentDidMount() {
        var queryParams = {clipId: getQueryVariable('clipId')};
        console.log("Query params", queryParams);
        if (queryParams.clipId) {
            var searchComponent = this;
            var body = {id: queryParams.clipId};
            fetch(this.props.apiHost + 'playerClips', {
                method: 'POST', body: JSON.stringify(body), headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (response) {
                return response.json();
            }).then(function (response) {
                console.log("Search Response", response);
                searchComponent.props.handleBuildPlayList(response);
            });
        }
    }
    _handleSearch = (e) => {
        console.log("Search Event", e);
        this.setState({ isLoading: true });
        var search = this;
        ReactGA.event({
            category: 'Football',
            action: 'Search',
            label: 'Player',
            value: e

        });
        e = e.toLowerCase();
        fetch(this.props.apiHost + 'playerSearch?name=' + e)
            .then(function (response) {
                return response.json();
            }).then(function (response) {
                console.log("Search Response", response);
                var retList = [];
                ReactGA.event({
                    category: 'Football',
                    action: 'SearchResult',
                    label: 'Player',
                    value: response.length
        
                });
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
        var gaLabel = 'None';
        var playerCount = 0;
        if (this.state.players) {
            gaLabel = '';
            playerCount = this.state.players.length;
            for (var z = 0; z < this.state.players.length; z++) {
                gaLabel += this.state.players[z] + ',';
                if (gaLabel.length > 100) {
                    break;
                }
            }
        }

        ReactGA.event({
            category: 'Football',
            action: 'BuildPlayList',
            label: gaLabel,
            value: playerCount

        });

        var searchComponent = this;
        fetch(this.props.apiHost + 'playerClips', {
            method: 'POST', body: JSON.stringify(body), headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            return response.json();
        }).then(function (response) {
            console.log("Search Response", response);
            searchComponent.props.handleBuildPlayList(response);
        });
    }

    render() {
        return (
            <div >
                <h4>Players</h4>
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
                    
                    {/* <ul>
                        {this.state.players.map(function (value) {
                            return <li key={value} >{value}</li>;
                        })}
                    </ul> */}
                    <button onClick={this._handleBuildPlayList}>Build Play List</button>
                </div>
                <div>

                </div>
            </div>

        );
    }
}

export default Search;
