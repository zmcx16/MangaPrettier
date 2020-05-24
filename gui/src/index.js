import React from 'react';
import ReactDOM from 'react-dom';

import App from './app';
import './index.css';

const path = window.require('path')
const log = window.require('electron-log')
const electron = window.require('electron')
const ipc = electron.ipcRenderer

const LOG_NAME = 'app.log'

// render process log setting
var log_path = ipc.sendSync('getLogPath', true)
log.transports.file.level = true
log.transports.console.level = true
log.transports.file.resolvePath = () => { return path.join(log_path, LOG_NAME) }
console.log = log.log
console.error = log.error

console.log('render process start')

ReactDOM.render(
  <App />,
  document.getElementById('root')
)
