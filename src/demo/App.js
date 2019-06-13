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

import UiApp from './ui/UiApp';

import './App.css';

import loadScript from '@lourd/load-script'



// ********************************************************
// Const
// ********************************************************

// const NEED_GOOGLE_API = true;

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
  async setupApi(gapiConfig) {
    try {
      if (typeof window.gapi === 'undefined') {
        await loadScript('https://apis.google.com/js/api.js');
      }
      if (!window.gapi.client) {
        await new Promise((resolve, reject) => window.gapi.load('client:auth2', {
          callback: resolve,
          onerror: reject
        }));
      }
      await window.gapi.client.init({
        apiKey: gapiConfig.apiKey,
        clientId: gapiConfig.clientId,
        discoveryDocs: gapiConfig.discoveryDocs,
        scope: gapiConfig.scopes.join(',')
      });
    } catch (error) {
      this.setState({
        loading: false,
        error
      });
      return;
    }
    this.auth = window.gapi.auth2.getAuthInstance();
    //this.setState({
    this.api = {
      client: window.gapi.client,
      googleAuth: this.auth,
      loading: false,
      signedIn: this.auth.isSignedIn.get()
    };
    this.onApi(this.api);
    this.auth.isSignedIn.listen(signedIn => this.setState({ signedIn }));
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
  toDicomWebQIDOUrl(path, googleAuth) {
    return path + '?access_token=' +
      googleAuth.currentUser.get().getAuthResponse(true).access_token;
  }
  listInstancesInSeries(client, googleAuth) {
    // const cloudRegion = 'us-central1';
    // const projectId = 'adjective-noun-123';
    const projectId = 'wide-journey-237913';
    const cloudRegion = 'europe-west2';
    const dicomDataset = 'TestDicom1';
    const dicomStore = 'TestDicomStorage2';
    // const parentName = `projects/${projectId}/locations/${cloudRegion}`;
    // For future dicomStores request
    const PrefixURL = 'https://healthcare.googleapis.com/v1beta1/';
    const parentName = `projects/${projectId}/locations/${cloudRegion}/datasets/${dicomDataset}/dicomStores/${dicomStore}`;
    const dicomWebPath = 'studies';
    const studyName = `${dicomWebPath}/1.3.6.1.4.1.25403.158515237678667.5060.20130807021436.4`;
    const seriesName = `${studyName}/series/1.3.6.1.4.1.25403.158515237678667.5060.20130807021436.5/instances`;

    // const COLUMN_POSITION_TAG = '0048021E';
    // const COLUMNS_TAG = '00280011';  // Number of columns in the image
    // // Per-frame Functional Groups Sequence
    // const FUNCTIONAL_GROUP_SEQUENCE_TAG = '52009230';
    // const PLANE_POSITION_SEQUENCE_TAG = '0048021A';  // Plane Position Sequence
    // const ROW_POSITION_TAG = '0048021F';
    // const ROWS_TAG = '00280010';  // Number of rows in the image
    // const SERIES_INSTANCE_UID_TAG = '0020000E';
    const SOP_INSTANCE_UID_TAG = '00080018';
    // // Unique identifier for the Series that is part of the Study
    // const STUDY_INSTANCE_UID_TAG = '0020000D';
    // // Total number of columns in pixel matrix
    // const TOTAL_PIXEL_MATRIX_COLUMNS_TAG = '00480006';
    // // Total number of rows in pixel matrix
    // const TOTAL_PIXEL_MATRIX_ROWS_TAG = '00480007';
    const request = { 
      parent: parentName,
      dicomWebPath: seriesName 
    };
    
    //client.healthcare.projects.locations.datasets.dicomStores.studies.retrieveStudy(request)
    client.healthcare.projects.locations.datasets.dicomStores.studies.series.retrieveSeries(request)      
      .then(instances => {
        for (let i = 0; i < instances.result.length; i++) {
          const dcmPath = `${PrefixURL}${parentName}/dicomWeb/${seriesName}/${instances.result[i][SOP_INSTANCE_UID_TAG].Value}`;
          console.log(`${this.toDicomWebQIDOUrl(dcmPath, googleAuth)}\n`)
          //console.log(`${dcmPath}\n`)
        }
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
    //     // this.logObject('Datasets = ', results);
    //     console.log(JSON.stringify(results, null, 2));
    //   })
    //   .catch(err => {
    //     console.error(err);
    //   });
  }
  listSeries(client) {
    // const cloudRegion = 'us-central1';
    // const projectId = 'adjective-noun-123';
    const projectId = 'wide-journey-237913';
    const cloudRegion = 'europe-west2';
    const dicomDataset = 'TestDicom1';
    const dicomStore = 'TestDicomStorage2';
    // const parentName = `projects/${projectId}/locations/${cloudRegion}`;
    // For future dicomStores request
    const parentName = `projects/${projectId}/locations/${cloudRegion}/datasets/${dicomDataset}/dicomStores/${dicomStore}`;
    const studyName = `studies/1.3.6.1.4.1.25403.158515237678667.5060.20130807021436.4/series`;
    
  
    const request = { 
      parent: parentName,
      dicomWebPath: studyName 
    };
    client.healthcare.projects.locations.datasets.dicomStores
      .searchForSeries(request)
      //searchForStudies(request)      
      .then(results => {
        console.log('Request successful:\n');
        //this.logObject('Datasets = ', results);
        console.log(JSON.stringify(results, null, 2));
      })
      .catch(err => {
        console.error(err);
      });
  }
  onApi(api) {
    this.logObject('onApi with api = ', api);
    //console.log(JSON.stringify(api, null, 2));
    //console.log(JSON.stringify(api, null, 2));
    // Authorize via google account
    if (api.client !== null && api.signedIn === false) {
      this.authorize().then( () => {      
        console.log('Authorized');
      });
    }
    // When next render comes, if both client and api ready - get dicoms from cloud
    if (api.client !== null && api.signedIn) {
      console.log('Requesting instances..');
      this.listInstancesInSeries(this.api.client, this.api.googleAuth);
    }
    // output html component
    // <div class="g-signin2" data-onsuccess="onSignIn"></div>
    const jsxOnApi = <p>
      onApi invoked
    </p>;
    return jsxOnApi;
  }
  componentDidMount() {
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
    let gapiProps = {};
    gapiProps.clientId = CLIENT_ID;
    gapiProps.apiKey = googleApiKey;
    gapiProps.discoveryDocs = arrDocs;
    gapiProps.scopes = arrScopes;
    this.setupApi(gapiProps);
  }
  authorize() {
    if (this.api.googleAuth) {
      this.api.googleAuth.signIn();
    }
  }
  /**
   * Main component render func callback
   */
  render() {
    const jsxRender = <div>
      <UiApp />
    </div>;
    return jsxRender;
  } // end render
} // end class

// export default App;
export default connect(store => store)(App);
