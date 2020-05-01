import React, { useRef, useState, useEffect } from 'react';
import logo from './logo.svg';

import CoreStatus from './components/coreStatus'
import PreviewImage from './components/previewImage'
import { sendCmdToCore } from './common/utils'
import './App.css'

const electron = window.require('electron')
const ipc = electron.ipcRenderer

const zerorpc = window.require("zerorpc");

// default heartbeatInterval is 5 sec
// but the HeartbeatError: Lost remote (_heartbeatExpirationTime) is default heartbeatInterval * 2, it causes your CPU bound job always failed.
// ref: https://stackoverflow.com/questions/31013472/zerorpc-keep-running-process-after-response-is-sent
// the first command will wait first heartbeatInterval, to enhance the send command, send test command on first to open the stream.
var client = new zerorpc.Client({
  heartbeatInterval: 5000,  
  timeout: 120
});


// app config
const TEST_CONNECT_CNT = 10

function App() {

  const coreStatusRef = useRef(null);
  const [previewImage, setPreviewImage] = useState()
   //co nt previewImageConfigRef = useRef()
    
  useEffect(() => {
  // componentDidMount is here!
  // componentDidUpdate is here!

  var testConnect_interval = null

  // ipc register
  ipc.on('getConfig_callback', (event, config) => {

    console.log('config: ' + JSON.stringify(config))

    // connect to mpcore
    client.connect("tcp://127.0.0.1:" + config['port']);

    // create component and pass config
    setPreviewImage(<PreviewImage coreStatusRef={coreStatusRef} port={config['port']} client={client} config={{preview_timeout: config['preview_timeout']}} />)

    /*
    // test core communication
    var testConnect = (retry) => {

      sendCmdToCore(client, coreStatusRef, {cmd: 'test_connect'}, (error, resp) => {
        //console.log('retry: ' + retry)
          if (error) {
          console.error(error)
          if (retry < TEST_CONNECT_CNT) {
            testConnect(retry + 1)
          }
          else {
            console.log('retry still failed...')
            coreStatusRef.current.setStatus(-1)
          }

        } else {
          console.log(resp);
        }
      })
    }

    testConnect_interval = setInterval(testConnect, 1000, 0)
    */
  })

  ipc.send('getConfig')

  return () => {
    // componentWillUnmount is here!
    clearInterval(testConnect_interval)
  }
}, [])


  return (
    <div className="App">
      <div className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h2>Welcome to React/Electron</h2>
      </div>
      <p className="App-intro">
        Hello Electron!!!
      </p>
      <CoreStatus ref={coreStatusRef} />
      {previewImage}
    </div>
  )
}

export default App;
