/**
 * @fileOverview Main App component
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import { GoogleApi } from '@lourd/react-google-api';

import UiApp from './ui/UiApp';

import './App.css';



// ********************************************************
// Const
// ********************************************************

const NEED_GOOGLE_API = true;

// ********************************************************
// Class
// ********************************************************

/**
 * Class App implements all application functionality. This is root class.
 */
class App extends React.Component {
  constructor(props) {
    super(props);
    this.onApi = this.onApi.bind(this);
  }
  logObject(strTitle, obj) {
    let str = '';
    for (let prp in obj) {
      if (str.length > 0) {
        str += '\n';
      }
      str += prp + ' = ' + obj[prp];
    }
    console.log(`${strTitle}\n${str}`);
  }
  onApi(api) {
    this.logObject('onApi with api = ', api)
    // api.authorize();
    if (api.error) {
      this.logObject('auth failed with error = ', api.error);
    }
    const jsxOnApi = <p>
      onApi invoked
    </p>;
    return jsxOnApi;
  }
  /**
   * Main component render func callback
   */
  render() {
    if (!NEED_GOOGLE_API) {
      return <UiApp />;
    }
    const CLIENT_ID = 'clientId.apps.googleusercontent.com'
    const googleApiKey = 'apikey'
    // const SERVICE_ACCOUNT_JSON = './My Project 90848-dcbe1e05fb8a.json'
    const discoveryDocs = 'https://healthcare.googleapis.com/$discovery/rest?labels=CHC_BETA&version=v1beta1' 
    // #############################################

    // const CLOUD_HEALTHCARE_API_BASE = 'https://healthcare.googleapis.com/v1beta1/projects/';
    const SCOPE_HEALTH = 'https://www.googleapis.com/auth/cloud-healthcare';
    const SCOPE_CLOUD = 'https://www.googleapis.com/auth/cloud-platform';

    const arrDocs = [
      discoveryDocs
    ];
    const arrScopes = [
      SCOPE_HEALTH,
      SCOPE_CLOUD
    ];

    const jsxRender = <div>
      <UiApp />
      <p>
        Test google api...
      </p>
      <GoogleApi clientId={CLIENT_ID} apiKey={googleApiKey} discoveryDocs={arrDocs} scopes={arrScopes} children={this.onApi} >
      </GoogleApi>
      
    </div>;
    return jsxRender;
  } // end render
} // end class

// export default App;
export default connect(store => store)(App);
