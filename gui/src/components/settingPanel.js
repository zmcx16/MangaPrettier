import React, { useState, useRef, useEffect, useCallback } from 'react'
import Popover from '@material-ui/core/Popover'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import DeleteIcon from '@material-ui/icons/Delete'
import { blue, lightBlue } from '@material-ui/core/colors'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import LinearProgress from '@material-ui/core/LinearProgress'
import InputLabel from '@material-ui/core/InputLabel'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Select from '@material-ui/core/Select'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import { FormattedMessage, useIntl } from "react-intl"

import EffectArgs from './effectArgs'
import { sendCmdToCore, IOSSwitch } from '../common/utils'

import settingPanelStyle from "./settingPanel.module.scss"

const electron = window.require('electron')
const ipc = electron.ipcRenderer
const shortid = window.require('shortid')

const langEffectMappingTable = {
  'brightness': 'effects.arg.brightness',
  'color': 'effects.arg.color',
  'contrast': 'effects.arg.contrast',
  'sharpness': 'effects.arg.sharpness',
  'factor': 'effects.arg.factor',
  'shadow': 'effects.arg.shadow',
  'midtones': 'effects.arg.midtones',
  'highlight': 'effects.arg.highlight',
  'outshadow': 'effects.arg.outshadow',
  'outhighlight': 'effects.arg.outhighlight',
  'channel': 'effects.arg.channel',
  'multiply': 'effects.arg.multiply',
  'soft_light': 'effects.arg.soft_light',
  'opacity': 'effects.arg.opacity',
  'RGB': 'effects.arg.channel.RGB',
  'R': 'effects.arg.channel.R',
  'G': 'effects.arg.channel.G',
  'B': 'effects.arg.channel.B',

  'levels': 'settingPanel.add.effects.levels',
  'blend': 'settingPanel.add.effects.blend',
  'image_enhance': 'settingPanel.add.effects.image_enhance',

  'mode': 'effects.arg.mode',
}

function SettingPanel({ settingPanelRef, appAPI, filesPanelAPI, previewImagePanelAPI, client, config}) {

  // lang
  const intl = useIntl()
  const getEffectMappingLangID = (name)=>{
    return intl.formatMessage({ id: langEffectMappingTable[name]})
  }
  const transEffectText = (effect_val)=>{
    let displayText = ''

    for (const [key, value] of Object.entries(effect_val)) {
      
      // for key
      if (key === 'type') { // do nothing

      } else if (key === 'mode') {

        displayText += getEffectMappingLangID(key) + ': ' + getEffectMappingLangID(value) + '; '
      } else {

        typeof value === 'string' ? 
          displayText += getEffectMappingLangID(key) + ': ' + getEffectMappingLangID(value) + '; ' :
          displayText += getEffectMappingLangID(key) + ': ' + value + '; '
      }
    }

    return displayText
  }

  // panel prop
  const [taskRunning, setTaskRunning] = useState(false)
  const taskRunningRef = useRef(false)

  // effects list
  const argsList = useRef([])

  const renderArgsList = (isDisabled)=>{
    return argsList.current.map((value, index) => {
      return (
        <ListItem key={shortid.generate()} className={index % 2 ? settingPanelStyle.listItemOdd : settingPanelStyle.listItemEven}>
          <ListItemText primary={getEffectMappingLangID(value.name)} primaryTypographyProps={{ style: ({ fontWeight: 'bold' }) }} className={settingPanelStyle.argsListName} />
          <ListItemText primary={transEffectText(value.value)} />
          <ListItemSecondaryAction>
            <IconButton disabled={isDisabled} edge="end" aria-label="delete" onClick={() => {
              argsList.current.splice(index, 1)
              setArgsListNodes(renderArgsList(false))
            }}>
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      )
    })
  }

  const [argsListNodes, setArgsListNodes] = useState(renderArgsList(false))

  // task button
  const [taskButton, setTaskButton] = useState(intl.formatMessage({ id: 'settingPanel.start' }))


  // progressbar
  const [progressBar, setProgressBar] = useState(0);


  // add window
  const [addWindow, setAddWindow] = useState(null);
  const addWindowClick = (event) => {
    setEnableEffect(previewImagePanelAPI.getEnableEffect())
    setAddWindow(event.currentTarget)
  }

  const addWindowClose = () => {
    setAddWindow(null);
  }

  const openAddWindow = Boolean(addWindow)
  const id_addWindow = openAddWindow ? 'addWindow' : undefined

  // enable effect switch
  const [enableEffect, setEnableEffect] = useState(true)

  // effects select
  const effectTypes = useRef([
    { name: 'levels', value: 'levels' },
    { name: 'blend', value: 'blend' },
    { name: 'image_enhance', value: 'image_enhance' }
  ])

  const [effectSelect, setEffectSelect] = useState({
    name: 'effect',
    effectType: effectTypes.current[0].value
  })

  const renderEffectArgsNode = (effectType) => { return <EffectArgs effectType={effectType} settingPanelRef={settingPanelRef} filesPanelAPI={filesPanelAPI} previewImagePanelAPI={previewImagePanelAPI} appAPI={appAPI}/>}
  const [effectArgsNode, setEffectArgsNode] = useState(renderEffectArgsNode(effectTypes.current[0].value))

  const effectSelectChange = (event) => {
    const name = event.target.name;
    setEffectSelect({
      ...effectSelect,
      [name]: event.target.value,
    })

    setEffectArgsNode(renderEffectArgsNode(event.target.value))
  }

  const argsRef = useRef({}) 

  const getEffectsParam = () => { return argsList.current.map((value, index) => { return value.value }) }

  // get effects param API
  settingPanelRef.current.getEffectsParam = getEffectsParam

  settingPanelRef.current.setArgsRef = (value) => {
    argsRef.current = value
  }

  settingPanelRef.current.getArgsRef = () => {
    return argsRef.current
  }

  const setTaskRunningUI = () => {
    setTaskButton(intl.formatMessage({ id: taskRunningRef.current ? 'settingPanel.cancel' : 'settingPanel.start' }))
    filesPanelAPI.setPanelStatus(!taskRunningRef.current)
    setArgsListNodes(renderArgsList(taskRunningRef.current))
    setTaskRunning(taskRunningRef.current)
  }

  // run task
  const task_heartbeat = useRef(0)
  
  const runTask = (imgs_path, effects) => {

    setProgressBar(0)

    var sendTaskCmd = () => {
      return new Promise((resolve, reject) => {

        var param = {
          cmd: 'run_task_async',
          task: 'batch',
          param: {
            imgs_path: imgs_path,
            effects: effects
          }
        }

        sendCmdToCore(client, param, (error, resp) => {
          if (error) {
            reject('sendTaskCmd failed')
          } else {
            resolve(resp)
          }
        })
      })
    }

    var getTaskResult = (param_t) => {
      return new Promise((resolve, reject) => {

        let task_id = param_t['task_id']

        sendCmdToCore(client, { 'cmd': 'get_task_result', 'task_id': task_id }, (error, resp) => {

          if (!taskRunningRef.current){
            console.log('task is stopped.');
            sendCmdToCore(client, { 'cmd': 'stop_task', 'task_id': task_id }, (error, resp)=>{})
            resolve(2)
          }
          else if (error) {
            console.error(error)
            reject('sendCmdToCore failed')
          } else {
            console.log(resp)

            if (resp['ret'] === 0) {
              setProgressBar(100)
              resolve(resp['ret'])

            } else if (resp['ret'] === 1) {
              let progress = parseInt(resp['data']['current'] * 100 / resp['data']['total'] )
              setProgressBar(progress)
              resolve(resp['ret'])
            }
            else {
              reject('getTaskResult failed')
            }
          }
        })
      }).then((status) => {
        if (status === 0) {       // task finished
          return new Promise((resolve, reject) => { resolve(intl.formatMessage({ id: 'settingPanel.message.missionComplete' })) })
        }
        else if (status === 2) {  // task stopped
          return new Promise((resolve, reject) => { resolve(intl.formatMessage({ id: 'settingPanel.message.taskStop' })) })
        }
        else {
          return getTaskResult(param_t)
        }
      }).catch((msg) => {
        console.error(msg)
        return new Promise((resolve, reject) => { reject('getTaskResult failed') })
      })
    }

    // set heartbeat
    task_heartbeat.current = setInterval(() => {
      sendCmdToCore(client, { cmd: 'test_connect' }, (error, resp) => {
        if (error) {
          console.error(error)
          clearInterval(task_heartbeat.current)
        } else {
          console.log(resp);
        }
      })
    }, config['heartbeat'])

    // send task command
    sendTaskCmd().then((resp) => {
      // get task result
      return getTaskResult({ task_id: resp['task_id'] })
    }).then((msg) => {
      // clear heartbeat and set status
      console.log(msg)
      appAPI.popModalWindow(
        <>
          <h2>{msg}</h2>
        </>
      )
      taskRunningRef.current = false
      setTaskRunningUI()
      clearInterval(task_heartbeat.current)
    }).catch((msg) => {
      // clear heartbeat and set status
      console.error(msg)
      appAPI.popModalWindow(
        <>
          <h2><FormattedMessage id={'settingPanel.message.sendCmdCoreFailed1'} /></h2>
          <p><FormattedMessage id={'settingPanel.message.sendCmdCoreFailed2'} /></p>
        </>
      )
      taskRunningRef.current = false
      setTaskRunningUI()
      clearInterval(task_heartbeat.current)
    })
  }
  

  return (
    <div className={settingPanelStyle.settingPanel}>
      <MuiThemeProvider theme={createMuiTheme({ palette: { primary: blue, secondary: lightBlue } })}>
        <div className={settingPanelStyle.argsPanel}>
          <div className={settingPanelStyle.argsBoard}>
            <List>
              {argsListNodes}
            </List>
          </div>
          <div className={settingPanelStyle.argsButtons}>
            <Button variant="contained" disabled={taskRunning} color="primary" className={settingPanelStyle.button} onClick={addWindowClick}><FormattedMessage id={'settingPanel.add'} /></Button>
            <div></div>
            <Button variant="contained" disabled={taskRunning} color="primary" className={settingPanelStyle.button} onClick={()=>{
              let effectSetting = ipc.sendSync('importEffects')
              console.log(effectSetting)
              if (effectSetting['ret'] === 0 && Object.keys(effectSetting['data']).length > 0) {
                argsList.current = effectSetting['data']
                setArgsListNodes(renderArgsList())
              }
            }}><FormattedMessage id={'settingPanel.import'} /></Button>
            <div></div>
            <Button variant="contained" disabled={taskRunning} color="primary" className={settingPanelStyle.button} onClick={()=>{
              let ret = ipc.sendSync('exportEffects', argsList.current)
              console.log(ret)
            }}><FormattedMessage id={'settingPanel.export'} /></Button>
            <div></div>
            <LinearProgress variant="determinate" color="secondary" value={progressBar} className={settingPanelStyle.progressBar} />
            <div></div>
            <Button variant="contained" color="primary" className={settingPanelStyle.exeButton}  onClick={()=>{

              var effects = getEffectsParam()
              var images = filesPanelAPI.getAllFiles()

              var imgs_path = []
              images.forEach(i => imgs_path = imgs_path.concat(i.images))       

              if (imgs_path.length === 0) {
                appAPI.popModalWindow(
                  <h2><FormattedMessage id={'settingPanel.message.noImage'} /></h2>
                )
              }
              else if (effects.length === 0) {
                appAPI.popModalWindow(
                  <h2><FormattedMessage id={'settingPanel.message.noEffect'} /></h2>
                )
              }
              else{
                taskRunningRef.current = !taskRunningRef.current
                setTaskRunningUI()
                if (taskRunningRef.current) {
                  runTask(imgs_path, effects)
                }
              }

            }}>{taskButton}</Button>
            <div></div>
          </div>
        </div>
        <Popover
          id={id_addWindow}
          open={openAddWindow}
          anchorEl={addWindow}
          onClose={addWindowClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <div className={settingPanelStyle.addWindow}>
            <div className={settingPanelStyle.effectMain}>
              <FormControl variant="outlined" className={settingPanelStyle.addWindowEffectSelect}>
                <InputLabel htmlFor="effect-select"><FormattedMessage id={'settingPanel.add.effects'} /></InputLabel>
                <Select
                  native
                  value={effectSelect.effectType}
                  onChange={effectSelectChange}
                  label="Effect"
                  inputProps={{
                    name: 'effectType',
                    id: 'effect-select',
                  }}
                >
                  {
                    effectTypes.current.map((value, index) => {
                      return <option key={shortid.generate()} value={value.value}>{getEffectMappingLangID(value.name)}</option>
                    })
                  }
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <IOSSwitch 
                    checked={enableEffect}
                    onChange={(event)=>{
                      setEnableEffect(event.target.checked)
                      previewImagePanelAPI.setEnableEffect(event.target.checked)
                      console.log(enableEffect)
                    }}
                    name="enableEffect"
                    color="primary"
                  />
                }
                label={intl.formatMessage({ id: 'previewImagePanel.enableEffect'})}
              />
            </div>
            <div className={settingPanelStyle.addWindowEffectArgs}>
              {effectArgsNode}
            </div>
            <div className={settingPanelStyle.addWindowButtons}>
              <Button variant="contained" color="primary" className={settingPanelStyle.button} onClick={() => { 
                
                console.log(argsRef.current)
                let displayName = argsRef.current.type
                argsList.current.push({ name: displayName, value: argsRef.current })
                setArgsListNodes(renderArgsList())
                addWindowClose()
              }}><FormattedMessage id={'settingPanel.ok'} /></Button>
              <div></div>
              <Button variant="contained" color="primary" className={settingPanelStyle.button} onClick={addWindowClose}><FormattedMessage id={'settingPanel.cancel'} /></Button>
            </div>
          </div>
        </Popover>
      </MuiThemeProvider>
    </div>
  )
}

export default SettingPanel