import React, { Component } from 'react';
import ReactGA from 'react-ga';
import './App.css';
import Footer from './Footer';
class ComingSoon extends Component {

    componentDidMount() {
    }

    render(){
        return (
            <div className="App ">
                <div className="min-page-height">
                <h2>Coming Soon!</h2>
                </div>
                <Footer />
            </div>
        );
    }
}

export default ComingSoon;

