import React, { Component } from 'react';
import NavBar from './NavBar';
import './Landing.css';
import '../node_modules/react-responsive-carousel/lib/styles/carousel.css';
import {
    Link
} from 'react-router-dom';
import ReactGA from 'react-ga';
var Carousel = require('react-responsive-carousel').Carousel;
ReactGA.initialize('UA-126876930-1');

class Landing extends Component {
    constructor(props) {
        super(props);
        // var api_host = 'http://localhost:3001/';
        var api_host = 'https://jrgrhzrkpb.execute-api.us-west-2.amazonaws.com/prod/';
        var sportOptions = [
            { name: "Football", route: "football" },
            { name: "Basketball", route: "basketball" }
        ]
        this.state = {
            sportOptions: sportOptions,
            apiHost: api_host,
            latestEpisodes: [],
            podcasts: [
                { name: "Fantasy Focus Football", img: "http://a.espncdn.com/combiner/i?img=i/espnradio/podcast/FantasyFocusFootball/FantasyFocusFootball_1400x1400.jpg" },
                { name: "Fantasy Footballers - Fantasy Football Podcast", img: "https://ssl-static.libsyn.com/p/assets/7/a/2/3/7a239cc67a06dbd1/fantasyfootball.jpg" }
            ],
            displayedPodcast: { legend: "" },
            currentDisplayIndex: 0
        }
    }
    componentDidMount() {
        var landing = this;
        fetch(this.state.apiHost + 'latestEpisodes')
            .then(function (response) {
                return response.json();
            }).then(function (response) {
                console.log("Latest Episode Response", response);
                var latestEpisodes = [];
                for (var podcast in response) {
                    var date = new Date(0);
                    date.setTime(response[podcast].publishDate);
                    for (var i = 0; i < landing.state.podcasts.length; i++) {
                        if (landing.state.podcasts[i].name === podcast) {
                            var legend = date.toISOString().split('T')[0] + ' ' + response[podcast].episode;
                            latestEpisodes.push({ legend: legend, episode: response[podcast].episode, date: date.toISOString().split('T')[0] });
                        }
                    }
                }
                console.log("Latest episodes", latestEpisodes);
                landing.setState({ latestEpisodes: latestEpisodes, displayedPodcast: latestEpisodes[landing.state.currentDisplayIndex] });
                var retList = [];
                // ReactGA.event({
                //     category: 'Ep',
                //     action: 'SearchResult',
                //     label: 'Player',
                //     value: response.length

                // });
                // for (var i = 0; i < response.length; i++) {
                //     retList.push(response[i]._source.name.trim());
                // }
                // console.log("search return list: ", retList);
                // search.setState({ options: retList, isLoading: false })
            });
    }
    _carouselChange(e,arg) {
        // console.log("Carousel change", e);
        // console.log("Carousel second arg",arg);
        if (this.state.latestEpisodes) {
            this.setState({ displayedPodcast: this.state.latestEpisodes[e],currentDisplayIndex: e });
            
        } else {
            this.setState({currentDisplayIndex: e})
        }
    }
    render() {
        return (
            <div>
                <div>

                    <header className="jumbotron my-4">
                        <h1 className="display-3">Fantasy Sports Podcast Search</h1>
                        <div className="row">
                            <div className="col-sm-6">
                                <p className="lead">The best way to search for clips focused on your players from your favorite fantasy sports podcasts.</p>
                                <ul className="lead">
                                    <li>Quickly find the clips you are looking for</li>
                                    <li>Discover new podcasts</li>
                                    <li>Share clips with your friends</li>
                                    <li>Build a playlist for your entire roster</li>
                                </ul>
                                <p className="lead">
                                    Try now, it's free!
                                </p>
                                <div className="row">
                                    <div className="col-xs-2">
                                        <button className="btn btn-primary btn-lg">Start Searching</button>
                                    </div>
                                    <div className="col-xs-2 ">
                                        <div className="input-group input-group-lg">
                                            <select className="form-control ">
                                                {this.state.sportOptions.map((option) =>
                                                    <option key={option.name} value={option}>{option.name}</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-4 offset-sm-1">
                                <Carousel selectedItem={this.state.currentDisplayIndex} showArrows={true} showThumbs={false} autoPlay={true} infiniteLoop={true} interval={3000} onChange={this._carouselChange.bind(this)}>
                                    {this.state.podcasts.map((podcast, index) =>
                                        <div key={index}>
                                            <img src={podcast.img} />
                                            <p className="legend">{podcast.name}</p>
                                        </div>
                                    )}
                                </Carousel>
                                <p>Latest Episode: <span>{this.state.displayedPodcast.legend}</span></p>

                            </div>
                        </div>

                    </header>


                    <div className="row text-center">

                        <div className="col-lg-3 col-md-6 mb-4">
                            <div className="card">
                                <i className="fas fa-football-ball fa-8x" />
                                <div className="card-body">
                                    <h4 className="card-title">Football</h4>
                                    <p className="card-text">Episodes from two podcasts.<br />
                                        10 hours of content and growing!</p>
                                </div>
                                <div className="card-footer">
                                    <Link className="btn btn-primary" to="/football">Football</Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-4">
                            <div className="card">
                                <i className="fas fa-basketball-ball fa-8x" />
                                <div className="card-body">
                                    <h4 className="card-title">Basketball</h4>
                                    <p className="card-text"><br /><br />Coming soon!</p>
                                </div>
                                <div className="card-footer">
                                    <button href="#" disabled className="btn btn-primary">Search</button>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-4">
                            <div className="card">
                                <i className="fas fa-futbol fa-8x" />
                                <div className="card-body">
                                    <h4 className="card-title">Soccer</h4>
                                    <p className="card-text"><br /><br />Coming Soon!</p>
                                </div>
                                <div className="card-footer">
                                    <button href="#" disabled className="btn btn-primary">Search</button>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-4">
                            <div className="card">
                                <i className="fas fa-baseball-ball fa-8x" />
                                <div className="card-body">
                                    <h4 className="card-title">Baseball</h4>
                                    <p className="card-text"><br /><br />Coming next fantasy season.</p>
                                </div>
                                <div className="card-footer">
                                    <button href="#" disabled className="btn btn-primary">Search</button>
                                </div>
                            </div>
                        </div>

                    </div>


                </div>



                <footer className="py-5 bg-dark">
                    <div className="container">
                    <p className="m-0 text-center"><a href="mailto:admin@ffpodcastsearch.com">Contact us</a></p>
                        <p className="m-0 text-center text-white">Copyright &copy; ffpodcastsearch.com 2018</p>
                    </div>

                </footer>
            </div>


        )
    }
}

export default Landing;