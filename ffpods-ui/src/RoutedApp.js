import React from 'react'
import {
    Router,
    Route,
    Link
} from 'react-router-dom';
import App from './App';
import Landing from './Landing';
import NavBar from './NavBar';
import createHistory from 'history/createBrowserHistory';
import ReactGA from 'react-ga';

ReactGA.initialize('UA-126876930-1');
var history = createHistory();
history.listen(function (location) {
    console.log("History event",location);
    ReactGA.pageview(location.pathname + location.search);    
});
const RoutedApp = () => (
    <Router history={history}>
        <div>          
            <NavBar></NavBar>  
            <div className="container">
                <Route exact path="/" component={Landing} />
                <Route path="/football" component={App} />
            </div>
        </div>
    </Router>
)
export default RoutedApp