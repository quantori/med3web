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
  listDatasets(client) {
    // const cloudRegion = 'us-central1';
    // const projectId = 'adjective-noun-123';
    const projectId = 'wide-journey-237913';
    const cloudRegion = 'europe-west2';
    const dicomDataset = 'TestDicom1';
    const dicomStore = 'TestDicomStorage1';
    // const parentName = `projects/${projectId}/locations/${cloudRegion}`;
    // For future dicomStores request
    const parentName = `projects/${projectId}/locations/${cloudRegion}/datasets/${dicomDataset}/dicomStores/${dicomStore}`;
    const dicomWebPath = 'studies';
  
    // const options = {
    //   url: dicomWebPath,
    //   headers: {
    //     'Content-Type': 'application/dicom+json; charset=utf-8',
    //   },
    //   method: 'GET',
    // };
  
    //request(options)
    const request = { 
      parent: parentName,
      dicomWebPath: dicomWebPath 
    };
    client.healthcare.projects.locations.datasets.dicomStores.
      searchForStudies(request)
      .then(results => {
        console.log('Request successful:\n');
        //console.log(results);
        this.logObject('Studies = ', results);
      })
      .catch(err => {
        console.error(err);
      });
  
    // const request = { parent: parentName };
    // // await ? are all of these sub-fields available? - should be for the cloud-healthcare scope
    // // client.healthcare.projects.locations.datasets.dicomStores
    // client.healthcare.projects.locations.datasets
    //   .list(request)
    //   .then(results => {
    //     // console.log(`Dicomstores in ${dicomDataset} :`, results.data);
    //     // console.log('Datasets:', results.data);//data format? array of strings?
    //     this.logObject('Datasets = ', results);
    //   })
    //   .catch(err => {
    //     console.error(err);
    //   });
  }
  onApi(api) {
    this.logObject('onApi with api = ', api);
    
    // Authorize via google account
    if (api.client !== null && api.signedIn === false) {
      api.authorize();
    }
    // When next render comes, if both client and api ready - get dicoms from cloud
    if (api.client !== null && api.signedIn) {
      this.listDatasets(api.client);
    }
    // output html component
    // <div class="g-signin2" data-onsuccess="onSignIn"></div>
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
    const googleApiKey = 'AIzaSyDFEE_nKXzp0tTZBIZiHpjw8E7m1EUcy6Y'
    const CLIENT_ID = '2955718871-q4onol31phj03ndpq344dkbd0qs8b51n.apps.googleusercontent.com'
    // const SERVICE_ACCOUNT_JSON = './My Project 90848-dcbe1e05fb8a.json'
    const discoveryDocs = 'https://healthcare.googleapis.com/$discovery/rest?labels=CHC_BETA&version=v1beta1' 
    // #############################################

    // const CLOUD_HEALTHCARE_API_BASE = 'https://healthcare.googleapis.com/v1beta1/projects/';
    const SCOPE_HEALTH = 'https://www.googleapis.com/auth/cloud-healthcare';
    // const SCOPE_CLOUD = 'https://www.googleapis.com/auth/cloud-platform';

    const arrDocs = [
      discoveryDocs
    ];
    const arrScopes = [
      SCOPE_HEALTH
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
