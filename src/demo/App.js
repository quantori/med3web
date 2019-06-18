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
import StoreActionType from './store/ActionTypes';
import UiApp from './ui/UiApp';
import LoaderUrlDicom from './engine/loaders/LoaderUrlDicom'
import './App.css'


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
  listInstancesInSeries(client, googleAuth, onUrlCaptured) {
    const projectId = 'wide-journey-237913';
    const cloudRegion = 'europe-west2';
    const dicomDataset = 'TestDicom1';
    const dicomStore = 'TestDicomStorage2';
    const PrefixURL = 'https://healthcare.googleapis.com/v1beta1/';
    const parentName = `projects/${projectId}/locations/${cloudRegion}/datasets/${dicomDataset}/dicomStores/${dicomStore}`;
    const dicomWebPath = 'studies';
    const studyName = `${dicomWebPath}/1.3.6.1.4.1.25403.158515237678667.5060.20130807021436.4`;
    const seriesName = `${studyName}/series/1.3.6.1.4.1.25403.158515237678667.5060.20130807021436.5/instances`;

    const SOP_INSTANCE_UID_TAG = '00080018';
    const request = { 
      parent: parentName,
      dicomWebPath: seriesName 
    };
    let urlArray = []
    //client.healthcare.projects.locations.datasets.dicomStores.studies.retrieveStudy(request)
    client.healthcare.projects.locations.datasets.dicomStores.studies.series.retrieveSeries(request)      
      .then(instances => {
        for (let i = 0; i < instances.result.length; i++) {
          const dcmPath = `${PrefixURL}${parentName}/dicomWeb/${seriesName}/${instances.result[i][SOP_INSTANCE_UID_TAG].Value}`;
          //console.log(`${this.toDicomWebQIDOUrl(dcmPath, googleAuth)}\n`)
          urlArray.push(this.toDicomWebQIDOUrl(dcmPath, googleAuth));
          //console.log(`${dcmPath}\n`)
        }
        onUrlCaptured(urlArray);
      })
      .catch(err => {
        console.error(err);
      });    
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
  setGoogleApiToStore(client) {
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_GOOGLE_API, googleApi: client });
  }
  loadGoogleDicom() {
    if (this.api.client !== null && this.api.signedIn) {
      console.log('Requesting instances..');
      this.listInstancesInSeries(this.api.client, this.api.googleAuth, (urlArray) => {
        //this.props.urlArray = urlArray;
        const store = this.props;
        const loader = new LoaderUrlDicom(store);
        const READ_FROM_GOOGLE = true;
        loader.loadFromUrlArray(urlArray, READ_FROM_GOOGLE);
      });
    }
  }
  onApi(api) {
    this.logObject('onApi with api = ', api);
    // Authorize via google account
    this.setGoogleApiToStore(this.api.client);
    if (api.client !== null && api.signedIn === false) {
      this.authorize().then( () => {      
        console.log('Authorized');        
      });
    }
    // When next render comes, if both client and api ready - get dicoms from cloud
    // if (api.client !== null && api.signedIn) {
    //   console.log('Requesting instances..');
    //   this.listInstancesInSeries(this.api.client, this.api.googleAuth, (urlArray) => {
    //     //this.props.urlArray = urlArray;
    //     const store = this.props;
    //     const loader = new LoaderUrlDicom(store);
    //     const READ_FROM_GOOGLE = true;
    //     loader.loadFromUrlArray(urlArray, READ_FROM_GOOGLE);
    //   });
    // }
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
