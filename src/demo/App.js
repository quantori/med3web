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
    const googleApiKey = 'SoemKeyCodeHere';
    const idGoogle = 'some_apps_id.apps.googleusercontent.com';

    const arrDocs = [
      'Med3Web is the first and only dicom medical data web 2d/3d viewer'
    ];
    const arrScopes = [
      'med3webApp'
    ];

    const jsxRender = <div>
      <UiApp />
      <p>
        Test google api...
      </p>
      <GoogleApi clientId={idGoogle} apiKey={googleApiKey} discoveryDocs={arrDocs} scopes={arrScopes} children={this.onApi} >
      </GoogleApi>
      
    </div>;
    return jsxRender;
  } // end render
} // end class

// export default App;
export default connect(store => store)(App);
