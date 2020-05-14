import React, { useState, useRef, useCallback } from 'react'
import IconButton from '@material-ui/core/IconButton'
import ZoomInIcon from '@material-ui/icons/ZoomIn'
import ZoomOutIcon from '@material-ui/icons/ZoomOut'
import TextField from '@material-ui/core/TextField'
import { blue, cyan } from '@material-ui/core/colors'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'

import { sendCmdToCore } from '../common/utils'

import previewImagePanelStyle from "./previewImagePanel.module.scss"

function PreviewImagePanel({ previewImagePanelRef, client, config }) {

  const toolBarRef = useRef(null)
  const [imageNode, setImageNode] = useState()
  const [imageScale, setImageScale] = useState(1.0)
  const [imageInfo, setImageInfo] = useState({width: 100, height: 100})

  const task_heartbeat = useRef(0)

  previewImagePanelRef.current.renderImageNode = (args) => {

    //console.log(args)
    var image_path = args['image']
    var effect_args = args['effects']

    // sendTaskCmd  
    var sendTaskCmd = () => {
      return new Promise((resolve, reject) => {

        var param = {
          cmd: 'run_task_async',
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
              setImageInfo({ width: resp['img_info']['width'], height: resp['img_info']['height'] })
              const base64Img = resp['img']
              setImageNode(<img src={`data:image/png;base64,${base64Img}`} alt='demo' style={{width: '100%'}}/>)
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
    }, 300)

    // send task command
    sendTaskCmd().then((resp) => {
      // get task result
      return getTaskResult({ preview_timeout: Date.now() + config['preview_timeout'], task_id: resp['task_id'] })
    }).then((msg) => {
      // clear heartbeat and set status
      console.log(msg)
      clearInterval(task_heartbeat.current)
    }).catch((msg) => {
      // clear heartbeat and set status
      console.error(msg)
      clearInterval(task_heartbeat.current)
    })
    
  }

  return (
    <div className={previewImagePanelStyle.previewImagePanel}>
      <MuiThemeProvider theme={createMuiTheme({ palette: { primary: cyan, secondary: blue } })}>
        <div className={previewImagePanelStyle.toolBar} ref={toolBarRef}>
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
          <span className={previewImagePanelStyle.imageScale}>Scale: {imageScale.toFixed(1)}</span>
          <div></div>
        </div>
        <div className={previewImagePanelStyle.imageNode} style={{ maxWidth: toolBarRef.current === null ? 2000 : toolBarRef.current.clientWidth-2 /* diff error */}}>
          <div style={{ width: `${imageScale * imageInfo.width}px`  }}>
            {imageNode}
          </div>
        </div>
        <div className={previewImagePanelStyle.imageLoading}>
        </div>
      </MuiThemeProvider>
    </div>
  )  
}

export default PreviewImagePanel