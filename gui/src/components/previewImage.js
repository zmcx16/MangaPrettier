import React, { useState, useEffect } from "react"
import { sendCmdToCore } from '../common/utils'

const PreviewImage = ({ langFont, client, coreStatusRef, config }) => {

  const [imageNode, setImageNode] = useState()

  return (
    <>
      {imageNode}
      <button onClick={()=>{

        var param = {
        'cmd': 'run_task_async',
        'type': 'bw',
        'src': 'I:\\work\\WORK\\MangaPrettier\\core\\test-sample\\MachikadoMazoku_02.jpg',
        'effects': [
            { 'mode': 'multiply', 'opacity': .8 },
            { 'mode': 'multiply', 'opacity': .8 },
            { 'mode': 'multiply', 'opacity': .8 },
            { 'mode': 'multiply', 'opacity': .8 },
            { 'mode': 'multiply', 'opacity': .8 },
            { 'mode': 'multiply', 'opacity': .8 }
        ],
        'show': false
        }

        coreStatusRef.current.setStatus(1)
        sendCmdToCore(client, coreStatusRef, param, (error, resp) => {
            if (error) {
                coreStatusRef.current.setStatus(-1)
                console.error(error)
            } else {

                console.log(resp)
                
                var getTaskResult = (param_t) => {

                    let preview_timeout = param_t['preview_timeout']
                    let task_id = param_t['task_id']

                    sendCmdToCore(client, coreStatusRef, { 'cmd': 'get_task_result', 'task_id': task_id }, (error, resp) => {
                        console.log('preview_timeout: ' + preview_timeout)
                        if (error) {
                            coreStatusRef.current.setStatus(-1)
                            console.error(error)
                        } else {
                            console.log(resp);

                            if (resp['ret'] === 0) {
                                const base64Img = resp['img']
                                //console.log(base64Img)
                                setImageNode(<img src={`data:image/png;base64,${base64Img}`} alt='demo' />)
                                coreStatusRef.current.setStatus(0)
                            } else if (resp['ret'] === 1) {
                                if (Date.now() < preview_timeout) { 
                                    setTimeout(getTaskResult, 100, param_t)
                                }
                                else {
                                    console.log('getTaskResult timeout.')
                                }
                            }
                            else {
                                console.log('getTaskResult failed.')
                            }
                        }
                    })
                }

                getTaskResult({ preview_timeout: Date.now() + config['preview_timeout'], task_id: resp['task_id'] })

            }
        })

      }}>test</button>
    </>
  )
  
}

export default PreviewImage
