import React, { useRef, useState, useEffect } from 'react';
import { StylesProvider } from "@material-ui/core/styles"
import Modal from '@material-ui/core/Modal'
import Backdrop from '@material-ui/core/Backdrop'
import Fade from '@material-ui/core/Fade'
import { IntlProvider } from "react-intl"

import SettingPanel from './components/settingPanel'
import FilesPanel from './components/filesPanel'
import PreviewImagePanel from './components/previewImagePanel'

import en from './i18n/en.js'
import zh_tw from './i18n/zh-tw.js'

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

  const [locale, setLocale] = useState('zh-TW')
  const [use_lang, l10n_messages] = locale === 'zh-TW' ? ['zh-TW', zh_tw] : ['en', en]

  const [openModal, setOpenModal] = useState(false)
  const [modalNode, setModalNode] = useState(<div></div>)

  const popModalWindow = (content) => {
    setModalNode(
      <div className={appStyle.modalWindow}>
        {content}
      </div>
    )
    setOpenModal(true)
  }

  const [loadingState, setLoadingState] = useState(false)
  const appAPI = {
    setLoadingState: setLoadingState,
    popModalWindow: popModalWindow
  }

  const [settingPanel, setSettingPanel] = useState()
  const settingPanelRef = useRef({
    getEffectsParam: null,
    setArgsRef: null,
    getArgsRef: null
  })
  const settingPanelAPI = {
    getEffectsParam: () =>{
      return settingPanelRef.current.getEffectsParam()
    }
  }

  const [filesPanel, setFilesPanel] = useState()
  const filesPanelRef = useRef({
    getSelectedFile: null,
    getAllFiles: null,
    setPanelStatus: null
  })
  const filesPanelAPI = {
    getSelectedFile: () =>{
      return filesPanelRef.current.getSelectedFile()
    },
    getAllFiles: () => {
      return filesPanelRef.current.getAllFiles()
    },
    setPanelStatus: (status) =>{
      return filesPanelRef.current.setPanelStatus(status)
    }
  }


  const [previewImagePanel, setPreviewImagePanel] = useState()
  const previewImagePanelRef = useRef({
    getEnableEffect: null,
    setEnableEffect: null,
    renderImageNode: null
  })
  const previewImagePanelAPI = {
    getEnableEffect: () => {
      return previewImagePanelRef.current.getEnableEffect()
    },
    setEnableEffect: (val) => {
      previewImagePanelRef.current.setEnableEffect(val)
    },
    renderImageNode: (args) => {
      previewImagePanelRef.current.renderImageNode(args)
    }
  }


  useEffect(() => {
  // componentDidMount is here!
  // componentDidUpdate is here!

    // ipc register
    ipc.on('setLang', (event, lang) => {
      console.log('setLang: ' + lang)
      if (lang === 'zh-TW') {
        setLocale('zh-TW')
      } else {
        setLocale('en')
      }
    })

    ipc.on('getConfig_callback', (event, config) => {

      console.log('config: ' + JSON.stringify(config))
      // connect to mpcore
      client.connect("tcp://127.0.0.1:" + config['port']);
      
      setLocale(config['lang'])

      setFilesPanel(<FilesPanel filesPanelRef={filesPanelRef} previewImagePanelAPI={previewImagePanelAPI} settingPanelAPI={settingPanelAPI}/>)
      setSettingPanel(<SettingPanel settingPanelRef={settingPanelRef} appAPI={appAPI} filesPanelAPI={filesPanelAPI} previewImagePanelAPI={previewImagePanelAPI} client={client} config={config}/>)
      setPreviewImagePanel(<PreviewImagePanel previewImagePanelRef={previewImagePanelRef} appAPI={appAPI} client={client} config={config}/>)
    })

    ipc.send('getConfig')

    return () => {
      // componentWillUnmount is here!

    }
  }, [])


  return (
    <StylesProvider injectFirst>
      <IntlProvider locale={use_lang} key={use_lang} defaultLocale='zh-TW' messages={l10n_messages}>
        <div className={appStyle.app}>
          <div className={appStyle.settingPanel}>
            {settingPanel}
          </div>
          <div className={appStyle.imagePanel}>
            {filesPanel}
            {previewImagePanel}
          </div>
        </div>
        <div className={appStyle.loadingBlock} style={{ display: loadingState ? 'block' : 'none'}}>
          <div className={appStyle.loadingAnimation}>
          </div>
          <div className={appStyle.loadingBackground}>
          </div>
        </div>
        <Modal
          aria-labelledby="transition-modal-title"
          aria-describedby="transition-modal-description"
          className={appStyle.modal}
          open={openModal}
          onClose={() => {setOpenModal(false)}}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Fade in={openModal}>
            {modalNode}
          </Fade>
        </Modal>
      </IntlProvider>
    </StylesProvider>
  )
}

export default App;
