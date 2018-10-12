import React, { Component } from 'react';
import {
    Link
} from 'react-router-dom';

class NavBar extends Component {
    render() {
        return (
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
                <div className="container">
                    <a className="navbar-brand" href="#">FF Podcast Search Beta</a>
                    <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarResponsive">
                        <ul className="navbar-nav ml-auto">
                            <li className="nav-item">
                                <Link className="nav-item nav-link" to="/">Home
                <span className="sr-only">(current)</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/football">Football</Link>

                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/basketball">Basketball</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/soccer">Soccer</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/baseball">Baseball</Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        );
    }
}

export default NavBar;