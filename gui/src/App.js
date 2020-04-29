import React, { useRef } from 'react';
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
  heartbeatInterval: 1000,  
  timeout: 120
});


// app config
const TEST_CONNECT_CNT = 10

function App() {

  const coreStatusRef = useRef(null);

  // ipc register
  ipc.on('getPort_callback', (event, port) => {

    console.log('port: ' + port)
    client.connect("tcp://127.0.0.1:" + port);

    //test core communication
    var testConnect = (retry) => {

      sendCmdToCore(client, coreStatusRef, {cmd: 'test_connect'}, (error, resp) => {
        console.log('retry: ' + retry)
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
          coreStatusRef.current.setStatus(0)
        }
      })
    }
    testConnect(0)

  })

  ipc.send('getPort')

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
      <PreviewImage coreStatusRef={coreStatusRef} client={client} />
    </div>
  )
}

export default App;
