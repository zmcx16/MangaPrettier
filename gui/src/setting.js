import React, { useRef, useState, useEffect } from 'react'
import InputLabel from '@material-ui/core/InputLabel'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import Button from '@material-ui/core/Button'
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
const shortid = window.require('shortid')

function Setting() {

  const [locale, setLocale] = useState('zh-TW')
  const [use_lang, l10n_messages] = locale === 'zh-TW' ? ['zh-TW', zh_tw] : ['en', en]

  const configRef = useRef({})

  const outputTypes = useRef([
    { name: 'JPEG', value: 'JPEG' },
    { name: 'PNG', value: 'PNG' },
    { name: 'BMP', value: 'BMP' }
  ])

  const [outputSelect, setOutputSelect] = useState({
    name: 'output',
    outputType: outputTypes.current[0].value
  })

  const renderOutputArgsNode = (outputType) => { 
    return outputType === 'JPEG' ? <JPEG configRef={configRef} /> :
        outputType === 'PNG' ? <PNG configRef={configRef} /> : 
        outputType === 'BMP' ? <BMP configRef={configRef} /> : <></>
  }
  const [outputArgsNode, setOutputArgsNode] = useState()

  const outputSelectChange = (event) => {
    const name = event.target.name;
    setOutputSelect({
      ...outputSelect,
      [name]: event.target.value,
    })

    setOutputArgsNode(renderOutputArgsNode(event.target.value))
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
      configRef.current = config
      setLocale(configRef.current['lang'])
      setOutputArgsNode(renderOutputArgsNode(configRef.current['output']['format']))
    })

    ipc.send('getConfig')

    return () => {
      // componentWillUnmount is here!

    }
  }, [])


  return (
    <StylesProvider injectFirst>
      <IntlProvider locale={use_lang} key={use_lang} defaultLocale='zh-TW' messages={l10n_messages}>
        <MuiThemeProvider theme={createMuiTheme({ palette: { primary: blue, secondary: lightBlue } })}>
          <div className={settingStyle.setting}>
            <div className={settingStyle.container}>
              <h1 className={settingStyle.containerTitle}><span className={settingStyle.containerTitleSpan}>&nbsp;Output&nbsp;</span></h1>
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
              <h1 className={settingStyle.containerTitle}><span className={settingStyle.containerTitleSpan}>&nbsp;Advanced&nbsp;</span></h1>
              <div className={settingStyle.advBlock}>
                <TextField id="outlined-basic" label="Outlined" variant="outlined" inputRef={(v) => { }}/>
              </div>
            </div>
          </div>
          <div className={settingStyle.settingButtons}>
            <Button variant="contained" color="primary" className={settingStyle.button} onClick={() => {

              console.log(configRef.current)

            }}><FormattedMessage id={'settingPanel.ok'} /></Button>
            <div></div>
            <Button variant="contained" color="primary" className={settingStyle.button} onClick={()=>{}}><FormattedMessage id={'settingPanel.cancel'} /></Button>
          </div>
        </MuiThemeProvider>
      </IntlProvider>
    </StylesProvider>
  )
}

export default Setting
