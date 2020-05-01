import React, { useState, useEffect, useRef, useCallback } from "react"
import { sendCmdToCore } from '../common/utils'

const PreviewImage = ({ langFont, port, client, coreStatusRef, config }) => {

  const [imageNode, setImageNode] = useState()
  
  const img_no = useRef(0)
  const task_heartbeat = useRef(0)
  
  const getImg = ()=>{

      task_heartbeat.current = setInterval(()=>{
        sendCmdToCore(client, { cmd: 'test_connect' }, (error, resp) => {
            if (error) {
                console.error(error)
                //client.connect("tcp://127.0.0.1:" + port);
                clearInterval(task_heartbeat.current)
            } else {
                console.log(resp);
            }
        })
    }, 300)

    let s = img_no.current %2 + 1
    img_no.current = img_no.current + 1

    console.log(img_no.current)

    var param = {
    'cmd': 'run_task_async',
    'type': 'bw',
    'src': 'I:\\work\\WORK\\MangaPrettier\\core\\test-sample\\MachikadoMazoku_0' + s + '.jpg',
    'effects': [
        { 'mode': 'multiply', 'opacity': .8 }
    ],
    'show': false
    }

    coreStatusRef.current.setStatus(1)
    sendCmdToCore(client, param, (error, resp) => {
        if (error) {  
            console.error(error)
            coreStatusRef.current.setStatus(-1)
            clearInterval(task_heartbeat.current)
        } else {

            console.log(resp)
            var getTaskResult = (param_t) => {

                let preview_timeout = param_t['preview_timeout']
                let task_id = param_t['task_id']

                sendCmdToCore(client, { 'cmd': 'get_task_result', 'task_id': task_id }, (error, resp) => {
                    console.log('preview_timeout: ' + preview_timeout)
                    if (error) {
                        console.error(error)
                        coreStatusRef.current.setStatus(-1)
                        clearInterval(task_heartbeat.current)
                    } else {
                        console.log(resp);

                        if (resp['ret'] === 0) {
                            const base64Img = resp['img']
                            //console.log(base64Img)
                            setImageNode(<img src={`data:image/png;base64,${base64Img}`} alt='demo' />)
                            coreStatusRef.current.setStatus(0)
                            clearInterval(task_heartbeat.current)
                        } else if (resp['ret'] === 1) {
                            if (Date.now() < preview_timeout) { 
                                getTaskResult(param_t)
                            }
                            else {
                                console.log('getTaskResult timeout.')
                                clearInterval(task_heartbeat.current)
                            }
                        }
                        else {
                            console.log('getTaskResult failed.')
                            clearInterval(task_heartbeat.current)
                        }
                    }
                })
            }

            getTaskResult({ preview_timeout: Date.now() + config['preview_timeout'], task_id: resp['task_id'] })

        }
    })

  }

  return (
    <>
      {imageNode}
      <button onClick={getImg}>test</button>
    </>
  )
  
}

export default PreviewImage
