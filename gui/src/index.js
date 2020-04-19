import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

const electron = window.require('electron')
const ipc = electron.ipcRenderer
const zerorpc = window.require("zerorpc");
var client = new zerorpc.Client({
  //heartbeatInterval: 10 * 1000,
  timeout: 120
});

// zerorpc function
function sendCmdToCore(cmd, msg, callback) {
  //console.log('sendCmdToCore: ' + cmd)
  client.invoke(cmd, msg, (error, res) => {
    callback(error, res)
  })
}

// ipc register
ipc.on('getPort_callback', (event, port) => {

  console.log('port: ' + port)

  client.connect("tcp://127.0.0.1:" + port);

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

  //test core communication
  sendCmdToCore('runTask', param, (error, resp) => {
    if (error) {
      console.error(error);
    } else {
      console.log(resp);
    }
  })

})

ipc.send('getPort')

ReactDOM.render(
  <App />,
  document.getElementById('root')
)
