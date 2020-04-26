import React, { useRef } from 'react';
import logo from './logo.svg';

import CoreStatus from './components/CoreStatus'
import './App.css';

const electron = window.require('electron')
const ipc = electron.ipcRenderer
const zerorpc = window.require("zerorpc");
var client = new zerorpc.Client({
  //heartbeatInterval: 10 * 1000,
  timeout: 120
});

// app config
const TEST_CONNECT_CNT = 10

function App() {

  const coreStatusRef = useRef(null);

  // zerorpc function
  function sendCmdToCore(cmd, msg, callback) {
    coreStatusRef.current.setStatus(1)
    //console.log('sendCmdToCore: ' + cmd)
    client.invoke(cmd, msg, (error, res) => {
      callback(error, res)
    })
  }

  // ipc register
  ipc.on('getPort_callback', (event, port) => {

    console.log('port: ' + port)

    client.connect("tcp://127.0.0.1:" + port);


    //test core communication
    var testConnect = (retry) => {
      sendCmdToCore('test_connect', null, (error, resp) => {
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
          coreStatusRef.current.setStatus(0)
          console.log(resp);
          var param = {
            'type': 'bw',
            'src': 'I:\\work\\WORK\\MangaPrettier\\core\\test-sample\\MachikadoMazoku_02.jpg',
            'effects': [
              { 'mode': 'multiply', 'opacity': .8 },
              { 'mode': 'multiply', 'opacity': .8 },
              { 'mode': 'multiply', 'opacity': .8 }
            ],
            'show': false
          }

          sendCmdToCore('run_task', param, (error, resp) => {
            if (error) {
              coreStatusRef.current.setStatus(-1)
              console.error(error)
            } else {
              coreStatusRef.current.setStatus(0)
              console.log(resp)
            }
          })
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
    </div>
  )
}

export default App;
