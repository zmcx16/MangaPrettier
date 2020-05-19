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

const shortid = window.require('shortid')

function SettingPanel({ settingPanelRef, appAPI, filesPanelAPI, previewImagePanelAPI, client}) {

  // panel prop
  const [taskRunning, setTaskRunning] = useState(false)

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

  // progressbar
  const [progressBar, setProgressBar] = useState(30);

  // add window
  const [addWindow, setAddWindow] = useState(null);
  const addWindowClick = (event) => {
    setAddWindow(event.currentTarget)
  }

  const addWindowClose = () => {
    setAddWindow(null);
  }

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

  // get effects param API
  settingPanelRef.current.getEffectsParam = () => {
    return argsList.current.map((value, index) => { return value.value })
  }

  settingPanelRef.current.setArgsRef = (value) => {
    argsRef.current = value
  }

  settingPanelRef.current.getArgsRef = () => {
    return argsRef.current
  }

  const openAddWindow = Boolean(addWindow)
  const id_addWindow = openAddWindow ? 'addWindow' : undefined


  // run task
  const task_heartbeat = useRef(0)
  
  const runTask = () => {

    var sendTaskCmd = () => {
      return new Promise((resolve, reject) => {

        var param = {
          cmd: 'run_task_async',
          task: 'batch'
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
          if (error) {
            console.error(error)
            reject('sendCmdToCore failed')
          } else {
            console.log(resp);

            if (resp['ret'] === 0) {
              resolve(resp['ret'])

            } else if (resp['ret'] === 1) {
              resolve(resp['ret'])

            }
            else {
              reject('getTaskResult failed')
            }
          }
        })
      }).then((status) => {
        if (status === 0) {
          return new Promise((resolve, reject) => { resolve('task success') })
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
            <Button variant="contained" disabled={taskRunning} color="primary" className={settingPanelStyle.button}>Import</Button>
            <div></div>
            <Button variant="contained" disabled={taskRunning} color="primary" className={settingPanelStyle.button}>Export</Button>
            <div></div>
            <LinearProgress variant="determinate" color="secondary" value={progressBar} className={settingPanelStyle.progressBar} />
            <div></div>
            <Button variant="contained" color="primary" className={settingPanelStyle.exeButton}  onClick={()=>{
              filesPanelAPI.setPanelStatus(taskRunning)
              setArgsListNodes(renderArgsList(!taskRunning))
              setTaskRunning(!taskRunning)
              runTask()
            }}>Start</Button>
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