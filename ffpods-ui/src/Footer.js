import React, { Component } from 'react';
import NavBar from './NavBar';
import './Landing.css';
import '../node_modules/react-responsive-carousel/lib/styles/carousel.css';
import {
    Link
} from 'react-router-dom';

class Footer extends Component {
    constructor(props) {
        super(props);       
        
    }
   
    render() {
        return (
            <div>               
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

export default Footer;