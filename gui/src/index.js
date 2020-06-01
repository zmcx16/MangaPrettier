import React from 'react'
import ReactDOM from 'react-dom'

import App from './app'

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

let href = ''
if (typeof window !== 'undefined') {
  href = window.location.href
}

ReactDOM.render(
  href.indexOf('?page=setting') !== -1 ? <div>setting page</div> : <App />,
  document.getElementById('root')
)
