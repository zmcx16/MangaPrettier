import React, { useRef, useState, useEffect } from 'react'
import InputLabel from '@material-ui/core/InputLabel'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import Button from '@material-ui/core/Button'
import Modal from '@material-ui/core/Modal'
import Backdrop from '@material-ui/core/Backdrop'
import Fade from '@material-ui/core/Fade'
import TextField from '@material-ui/core/TextField'
import { blue, lightBlue } from '@material-ui/core/colors'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import { StylesProvider } from "@material-ui/core/styles"
import { IntlProvider, FormattedMessage } from "react-intl"

import JPEG from './components/output/jpeg'
import PNG from './components/output/png'
import BMP from './components/output/bmp'

import en from './i18n/en.js'
import zh_tw from './i18n/zh-tw.js'

import settingStyle from './setting.module.scss'

const electron = window.require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote
const shortid = window.require('shortid')

function Setting() {

  const HEART_BEAT_MIN = 100
  const PREVIEW_TIMEOUT_MIN = 30000

  var config = ipc.sendSync('getConfigSync')
  console.log('config: ' + JSON.stringify(config))

  const configRef = useRef(config)

  const [locale, setLocale] = useState(configRef.current['lang'])
  const [use_lang, l10n_messages] = locale === 'zh-TW' ? ['zh-TW', zh_tw] : ['en', en]

  const [openModal, setOpenModal] = useState(false)
  const [modalNode, setModalNode] = useState(<div></div>)

  const popModalWindow = (content) => {
    setModalNode(
      <div className={settingStyle.modalWindow}>
        {content}
      </div>
    )
    setOpenModal(true)
  }

  const outputTypes = useRef([
    { name: 'JPEG', value: 'JPEG' },
    { name: 'PNG', value: 'PNG' },
    { name: 'BMP', value: 'BMP' }
  ])

  const [outputSelect, setOutputSelect] = useState({
    name: 'output',
    outputType: configRef.current['output']['format']
  })

  const renderOutputArgsNode = (outputType) => { 
    return outputType === 'JPEG' ? <JPEG configRef={configRef} /> :
        outputType === 'PNG' ? <PNG configRef={configRef} /> : 
        outputType === 'BMP' ? <BMP configRef={configRef} /> : <></>
  }
  const [outputArgsNode, setOutputArgsNode] = useState(renderOutputArgsNode(configRef.current['output']['format']))

  const outputSelectChange = (event) => {
    const name = event.target.name;
    setOutputSelect({
      ...outputSelect,
      [name]: event.target.value,
    })

    setOutputArgsNode(renderOutputArgsNode(event.target.value))
  }


  const renderAdvConfigNode = () => {
    return (
      <div className={settingStyle.advBlock}>
        <TextField id="heartbeat-basic" defaultValue={configRef.current['heartbeat']} label={<FormattedMessage id={'setting.adv.heartbeat'} />} variant="outlined" onChange={(event) => {
          configRef.current['heartbeat'] = event.target.value
        }} />
        <TextField id="preview_timeout-basic" defaultValue={configRef.current['preview_timeout']} label={<FormattedMessage id={'setting.adv.preview_timeout'} />} variant="outlined" onChange={(event)=>{
          configRef.current['preview_timeout'] = event.target.value
        }} />
      </div>
    )
  }
  const [advConfigNode, setAdvConfigNode] = useState(renderAdvConfigNode())

  return (
    <StylesProvider injectFirst>
      <IntlProvider locale={use_lang} key={use_lang} defaultLocale='zh-TW' messages={l10n_messages}>
        <MuiThemeProvider theme={createMuiTheme({ palette: { primary: blue, secondary: lightBlue } })}>
          <div className={settingStyle.setting}>
            <div className={settingStyle.container}>
              <h1 className={settingStyle.containerTitle}><span className={settingStyle.containerTitleSpan}>&nbsp;<FormattedMessage id={'setting.output'} />&nbsp;</span></h1>
              <div className={settingStyle.outputBlock}>
                <FormControl variant="outlined" className={settingStyle.outputSelect}>
                  <InputLabel htmlFor="output-select"><FormattedMessage id={'setting.output.format'} /></InputLabel>
                  <Select
                    native
                    value={outputSelect.outputType}
                    onChange={outputSelectChange}
                    label="Output"
                    inputProps={{
                      name: 'outputType',
                      id: 'output-select',
                    }}
                  >
                    {
                      outputTypes.current.map((value, index) => {
                        return <option key={shortid.generate()} value={value.value}>{value.name}</option>
                      })
                    }
                  </Select>
                </FormControl>
                <div className={settingStyle.outputArgs}>
                  {outputArgsNode}
                </div>
              </div>
            </div>
            <div className={settingStyle.container}>
              <h1 className={settingStyle.containerTitle}><span className={settingStyle.containerTitleSpan}>&nbsp;<FormattedMessage id={'setting.adv'} />&nbsp;</span></h1>
              {advConfigNode}
            </div>
          </div>
          <div className={settingStyle.settingButtons}>
            <Button variant="contained" color="primary" className={settingStyle.button} onClick={() => {

              // input valid check
              let heartbeat = parseInt(configRef.current['heartbeat'])
              let preview_timeout = parseInt(configRef.current['preview_timeout'])
              if (!heartbeat || heartbeat < HEART_BEAT_MIN){
                popModalWindow(<FormattedMessage id={'setting.adv.heartbeat.error'} />)
                return
              }
              if (!preview_timeout || preview_timeout < PREVIEW_TIMEOUT_MIN){
                popModalWindow(<FormattedMessage id={'setting.adv.preview_timeout.error'} />)
                return
              }

              if(ipc.sendSync('saveConfig', configRef.current)){
                popModalWindow(<FormattedMessage id={'setting.save.success'} />)
              }
              else{
                popModalWindow(<FormattedMessage id={'setting.save.failed'} />)
              }

            }}><FormattedMessage id={'settingPanel.ok'} /></Button>
            <div></div>
            <Button variant="contained" color="primary" className={settingStyle.button} onClick={()=>{
              remote.getCurrentWindow().close()
            }}><FormattedMessage id={'settingPanel.cancel'} /></Button>
          </div>
          <Modal
            aria-labelledby="transition-modal-title"
            aria-describedby="transition-modal-description"
            className={settingStyle.modal}
            open={openModal}
            onClose={() => { setOpenModal(false) }}
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
        </MuiThemeProvider>
      </IntlProvider>
    </StylesProvider>
  )
}

export default Setting
