import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import RoutedApp from './RoutedApp';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<RoutedApp />, document.getElementById('root'));
registerServiceWorker();
