import React, { useState, useRef } from 'react'
import { sendCmdToCore } from '../common/utils'

import previewImagePanelStyle from "./previewImagePanel.module.scss"

function PreviewImagePanel({ client, coreStatusRef, config, renderImageNodeCallback }) {

  const [imageNode, setImageNode] = useState()
  const task_heartbeat = useRef(0)

  renderImageNodeCallback.current = () => {

    //console.log(args)

    // sendTaskCmd  
    var sendTaskCmd = () => {
      return new Promise((resolve, reject) => {

        var param = {
          'cmd': 'run_task_async',
          'type': 'bw',
          'src': 'I:\\work\\WORK\\MangaPrettier\\core\\test-sample\\MachikadoMazoku_01.jpg',
          'effects': [
            { 'mode': 'multiply', 'opacity': .8 }
          ],
          'show': false
        }

        coreStatusRef.current.setStatus(1)

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
              const base64Img = resp['img']
              //console.log(base64Img)
              setImageNode(<img src={`data:image/png;base64,${base64Img}`} alt='demo' />)
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
      coreStatusRef.current.setStatus(0)
      clearInterval(task_heartbeat.current)
    }).catch((msg) => {
      // clear heartbeat and set status
      console.error(msg)
      coreStatusRef.current.setStatus(-1)
      clearInterval(task_heartbeat.current)
    })
    
  }

  return (
    <div className={previewImagePanelStyle.previewImagePanel}>
      <div className={previewImagePanelStyle.imageNode}>
        {imageNode}
      </div>
    </div>
  )  
}

export default PreviewImagePanel