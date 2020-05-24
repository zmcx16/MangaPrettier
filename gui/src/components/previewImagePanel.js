import React, { useState, useRef, useCallback } from 'react'
import IconButton from '@material-ui/core/IconButton'
import ZoomInIcon from '@material-ui/icons/ZoomIn'
import ZoomOutIcon from '@material-ui/icons/ZoomOut'
import TextField from '@material-ui/core/TextField'
import { blue, cyan } from '@material-ui/core/colors'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import ScrollContainer from 'react-indiana-drag-scroll'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import { FormattedMessage, useIntl } from "react-intl"

import { sendCmdToCore, IOSSwitch } from '../common/utils'

import previewImagePanelStyle from "./previewImagePanel.module.scss"

function PreviewImagePanel({ previewImagePanelRef, appAPI, client, config }) {
  
  // lang
  const intl = useIntl()

  const toolBarRef = useRef(null)
  const [enableEffect, setEnableEffect] = useState(true)
  const [imageNode, setImageNode] = useState()
  const [imageOrgNode, setImageOrgNode] = useState()
  const [imageScale, setImageScale] = useState(1.0)
  const [imageInfo, setImageInfo] = useState({width: 100, height: 100})

  const task_heartbeat = useRef(0)

  // PreviewImagePanel API
  previewImagePanelRef.current.getEnableEffect = () =>{
    return enableEffect
  }

  previewImagePanelRef.current.setEnableEffect = (val) =>{
    setEnableEffect(val)
  }

  previewImagePanelRef.current.renderImageNode = (args) => {

    appAPI.setLoadingState(true)

    //console.log(args)
    var image_path = args['image']
    var effect_args = args['effects']

    // sendTaskCmd  
    var sendTaskCmd = () => {
      return new Promise((resolve, reject) => {

        var param = {
          cmd: 'run_task_async',
          task: 'preview',
          src: image_path,
          effects: effect_args,
          show: false
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

        let preview_timeout = param_t['preview_timeout']
        let task_id = param_t['task_id']

        sendCmdToCore(client, { 'cmd': 'get_task_result', 'task_id': task_id }, (error, resp) => {
          console.log('preview_timeout: ' + preview_timeout)
          if (error) {
            console.error(error)
            reject('sendCmdToCore failed')
          } else {
            console.log(resp);

            if (resp['ret'] === 0) {
              setImageInfo({ width: resp['data']['img_info']['width'], height: resp['data']['img_info']['height'] })
              setImageNode(<img src={`data:image/png;base64,${resp['data']['img']}`} alt='demo' style={{ width: '100%'}}/>)
              setImageOrgNode(<img src={`data:image/png;base64,${resp['data']['img_org']}`} alt='demo' style={{ width: '100%'}} />)
              resolve(resp['ret'])

            } else if (resp['ret'] === 1) {
              if (Date.now() < preview_timeout) {
                resolve(resp['ret'])
              }
              else {
                reject('getTaskResult timeout')
              }
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
    }, config['heartbeat'])

    // send task command
    sendTaskCmd().then((resp) => {
      // get task result
      return getTaskResult({ preview_timeout: Date.now() + config['preview_timeout'], task_id: resp['task_id'] })
    }).then((msg) => {
      // clear heartbeat and set status
      appAPI.setLoadingState(false)
      console.log(msg)
      clearInterval(task_heartbeat.current)
    }).catch((msg) => {
      // clear heartbeat and set status
      appAPI.setLoadingState(false)
      console.error(msg)
      appAPI.popModalWindow(
        <>
          <h2><FormattedMessage id={'settingPanel.message.sendCmdCoreFailed1'} /></h2>
          <p><FormattedMessage id={'settingPanel.message.sendCmdCoreFailed2'} /></p>
        </>
      )
      clearInterval(task_heartbeat.current)
    })
    
  }

  return (
    <div className={previewImagePanelStyle.previewImagePanel}>
      <MuiThemeProvider theme={createMuiTheme({ palette: { primary: cyan, secondary: blue } })}>
        <div className={previewImagePanelStyle.toolBar} ref={toolBarRef}>
          <div></div>
          <FormControlLabel
            control={
              <IOSSwitch 
                checked={enableEffect}
                onChange={(event)=>{
                  setEnableEffect(event.target.checked)
                  console.log(enableEffect)
                }}
                name="enableEffect"
                color="primary"
              />
            }
            label={intl.formatMessage({ id: 'previewImagePanel.enableEffect'})}
          />
          <div></div>
          <IconButton variant="contained" color="secondary" onClick={useCallback(()=>{
            setImageScale(imageScale + 0.1)
          }, [imageScale])}>
            <ZoomInIcon fontSize="large"/>
          </IconButton >
          <div></div>
          <IconButton variant="contained" color="secondary" onClick={useCallback(() => {
            setImageScale(Math.max(imageScale - 0.1, 0))
          }, [imageScale])}>
            <ZoomOutIcon fontSize="large" />
          </IconButton >
          <div></div>
          <span className={previewImagePanelStyle.imageScale}><FormattedMessage id={'previewImagePanel.scale'} />{imageScale.toFixed(1)}</span>
          <div></div>
        </div>
        <div className={previewImagePanelStyle.imageNode} style={{ maxWidth: toolBarRef.current === null ? 2000 : toolBarRef.current.clientWidth-2 /* diff error */}}>
          <ScrollContainer className="scroll-container" hideScrollbars={false} style={{height: '100%'}}>
            <div style={{ width: `${imageScale * imageInfo.width}px`, height: `${imageScale * imageInfo.height}px`   }}>
              <div style={{ display: enableEffect ? 'block' : 'none' }}>{ imageNode }</div>
              <div style={{ display: enableEffect ? 'none' : 'block' }}>{ imageOrgNode }</div>
            </div>
          </ScrollContainer>
        </div>
      </MuiThemeProvider>
    </div>
  )  
}

export default PreviewImagePanel