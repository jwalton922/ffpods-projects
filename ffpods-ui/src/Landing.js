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
ReactGA.pageview(window.location.pathname + window.location.search);
class Landing extends Component {
    constructor(props) {
        super(props);
        var sportOptions = [
            { name: "Football", route: "football" },
            { name: "Basketball", route: "basketball" }
        ]
        this.state = {
            sportOptions: sportOptions
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
                                <Carousel showArrows={true} showThumbs={false} autoPlay={true} infiniteLoop={true} interval={3000}>
                                    <div>
                                        <img src="http://a.espncdn.com/combiner/i?img=i/espnradio/podcast/FantasyFocusFootball/FantasyFocusFootball_1400x1400.jpg" />
                                        <p className="legend">Fantasy Football Focus</p>
                                    </div>
                                    <div>
                                        <img src="https://ssl-static.libsyn.com/p/assets/7/a/2/3/7a239cc67a06dbd1/fantasyfootball.jpg" />
                                        <p className="legend">The Fantasy Footballers</p>
                                    </div>
                                </Carousel>
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
                        <p className="m-0 text-center text-white">Copyright &copy; Your Website 2018</p>
                    </div>

                </footer>
            </div>


        )
    }
}

export default Landing;