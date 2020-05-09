import React, { useRef, useState, useEffect } from 'react';
import { StylesProvider } from "@material-ui/core/styles"

import CoreStatus from './components/coreStatus'
import PreviewImage from './components/previewImage'
import FilesPanel from './components/filesPanel'
import PreviewImagePanel from './components/previewImagePanel'

import appStyle from './app.module.scss'

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


function App() {

  const coreStatusRef = useRef(null);
  const [previewImage, setPreviewImage] = useState()

  const [filesPanel, setFilesPanel] = useState()
  const [previewImagePanel, setPreviewImagePanel] = useState()
  
  const resizeFileListCallback = useRef(null)
  const renderImageNodeCallback = useRef(null)

  const resizeFileList = () => {
    resizeFileListCallback.current()
  }

  const renderImageNode = () => {
    renderImageNodeCallback.current()
  }




  useEffect(() => {
  // componentDidMount is here!
  // componentDidUpdate is here!

    setFilesPanel(<FilesPanel resizeFileListCallback={resizeFileListCallback} />)

    // ipc register
    ipc.on('getConfig_callback', (event, config) => {

      console.log('config: ' + JSON.stringify(config))
      // connect to mpcore
      client.connect("tcp://127.0.0.1:" + config['port']);
      // create component and pass config
      //setPreviewImage(<PreviewImage coreStatusRef={coreStatusRef} port={config['port']} client={client} config={{preview_timeout: config['preview_timeout']}} />)

      setPreviewImagePanel(<PreviewImagePanel client={client} coreStatusRef={coreStatusRef} config={{ preview_timeout: config['preview_timeout'] }} renderImageNodeCallback={renderImageNodeCallback} />)

      resizeFileList()
    })

    ipc.send('getConfig')

    return () => {
      // componentWillUnmount is here!

    }
  }, [])


  return (
    <StylesProvider injectFirst>
      <div className={appStyle.app}>
        <CoreStatus ref={coreStatusRef} />
        {previewImage}
        <button onClick={renderImageNode}>test</button>
        <button onClick={() => { 

          resizeFileList() 

        }}>test2</button>
        <div className={appStyle.settingPanel}>
          settingPanel
        </div>
        <div className={appStyle.imagePanel}>
          {filesPanel}
          {previewImagePanel}
        </div>
      </div>
    </StylesProvider>
  )
}

export default App;
