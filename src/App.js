// App.js

import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import './App.css';
import LandingPageImage from './images/image1.jpg'; // Import the landing page image
import NewPage from './components/NewPage'; // Import the NewPage component
import Navbar from './components/Navbar'; // Import the Navbar component

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Navbar /> {/* Include the Navbar component */}
          <img src={LandingPageImage} alt="Landing Page Image" />
          <h1>Welcome to Black Tea Swap</h1>
          <p>
            This is the landing page for Black Tea Swap, a decentralized exchange (DEX) platform for trading tea-related assets.
          </p>
          <p>
            Get started by exploring our tea market, trading platform, and community features.
          </p>
          <a
            className="App-link"
            href="http://68.183.150.222:3000/flechemano/black-tea"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit Black Tea Swap
          </a>
        </header>
      </div>
      <Route path="/newpage" component={NewPage} /> {/* Define route for NewPage */}
    </Router>
  );
}

export default App;
