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
import Select from '@material-ui/core/Select'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'

import EffectArgs from './effectArgs'
import { sendCmdToCore } from '../common/utils'

import settingPanelStyle from "./settingPanel.module.scss"

const electron = window.require('electron')
const ipc = electron.ipcRenderer
const shortid = window.require('shortid')

function SettingPanel({ settingPanelRef, appAPI, filesPanelAPI, previewImagePanelAPI, client}) {

  // panel prop
  const [taskRunning, setTaskRunning] = useState(false)
  const taskRunningRef = useRef(false)

  // effects list
  const argsList = useRef([])

  const renderArgsList = (isDisabled)=>{
    return argsList.current.map((value, index) => {
      return (
        <ListItem key={shortid.generate()} className={index % 2 ? settingPanelStyle.listItemOdd : settingPanelStyle.listItemEven}>
          <ListItemText primary={value.name} primaryTypographyProps={{ style: ({ fontWeight: 'bold' }) }} className={settingPanelStyle.argsListName} />
          <ListItemText primary={value.text} />
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
  const [taskButton, setTaskButton] = useState('start')


  // progressbar
  const [progressBar, setProgressBar] = useState(0);


  // add window
  const [addWindow, setAddWindow] = useState(null);
  const addWindowClick = (event) => {
    setAddWindow(event.currentTarget)
  }

  const addWindowClose = () => {
    setAddWindow(null);
  }

  const openAddWindow = Boolean(addWindow)
  const id_addWindow = openAddWindow ? 'addWindow' : undefined


  // effects select
  const effectTypes = useRef([
    { name: 'multiply', value: 'multiply' },
    { name: 'soft light', value: 'soft_light' }
  ])

  const [effectSelect, setEffectSelect] = useState({
    name: 'effect',
    effectType: effectTypes.current[0].value
  });

  const renderEffectArgsNode = (effectType) => { return <EffectArgs effectType={effectType} settingPanelRef={settingPanelRef} filesPanelAPI={filesPanelAPI} previewImagePanelAPI={previewImagePanelAPI} />}
  const [effectArgsNode, setEffectArgsNode] = useState(renderEffectArgsNode(effectTypes.current[0].value))

  const effectSelectChange = (event) => {
    const name = event.target.name;
    setEffectSelect({
      ...effectSelect,
      [name]: event.target.value,
    });

    setEffectArgsNode(renderEffectArgsNode(event.target.value))
  };

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
    setTaskButton(taskRunningRef.current ? 'cancel' : 'start')
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
            console.log(resp);

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
          return new Promise((resolve, reject) => { resolve('Mission Complete!') })
        }
        else if (status === 2) {  // task stopped
          return new Promise((resolve, reject) => { resolve('Task Stopped!') })
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
    }, 300)

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
          <h2>Send command to core process failed.</h2>
          <p>Please restart MangaPrettier and try again.</p>
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
            <Button variant="contained" disabled={taskRunning} color="primary" className={settingPanelStyle.button} onClick={addWindowClick}>Add</Button>
            <div></div>
            <Button variant="contained" disabled={taskRunning} color="primary" className={settingPanelStyle.button} onClick={()=>{
              let effectSetting = ipc.sendSync('importEffects')
              console.log(effectSetting)
              if (effectSetting['ret'] === 0 && Object.keys(effectSetting['data']).length > 0) {
                argsList.current = effectSetting['data']
                setArgsListNodes(renderArgsList())
              }
            }}>Import</Button>
            <div></div>
            <Button variant="contained" disabled={taskRunning} color="primary" className={settingPanelStyle.button} onClick={()=>{
              let ret = ipc.sendSync('exportEffects', argsList.current)
              console.log(ret)
            }}>Export</Button>
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
                  <h2>No image in the file list.</h2>
                )
              }
              else if (effects.length === 0) {
                appAPI.popModalWindow(
                  <h2>No effect in the setting panel.</h2>
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
            <FormControl variant="outlined" className={settingPanelStyle.addWindowEffectSelect}>
              <InputLabel htmlFor="effect-select">Effects</InputLabel>
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
                    return <option key={shortid.generate()} value={value.value}>{value.name}</option>
                  })
                }
              </Select>
            </FormControl>
            <div className={settingPanelStyle.addWindowEffectArgs}>
              {effectArgsNode}
            </div>
            <div className={settingPanelStyle.addWindowButtons}>
              <Button variant="contained" color="primary" className={settingPanelStyle.button} onClick={() => { 
                
                console.log(argsRef.current)
                let displayName = argsRef.current.mode
                let displayText = ''
                for (const [key, value] of Object.entries(argsRef.current)) {
                  if (key !== 'mode' && key !== 'type'){
                    displayText += key + ': ' + value + '; '
                  }
                }
                argsList.current.push({ name: displayName, text: displayText, value: argsRef.current })
                setArgsListNodes(renderArgsList())
                addWindowClose()
              }}>Ok</Button>
              <div></div>
              <Button variant="contained" color="primary" className={settingPanelStyle.button} onClick={addWindowClose}>Cancel</Button>
            </div>
          </div>
        </Popover>
      </MuiThemeProvider>
    </div>
  )
}

export default SettingPanel