import React, { useState, useEffect } from "react"
import { sendCmdToCore } from '../common/utils'

const PreviewImage = ({ langFont, client, coreStatusRef }) => {

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
        
        for(let x=0; x<10; x++){
          setTimeout(() => {sendCmdToCore(client, coreStatusRef, {cmd: 'warm_up'}, (error, resp) => {console.log(resp)})}, x*100)
        }

        setTimeout(() => {
            sendCmdToCore(client, coreStatusRef, param, (error, resp) => {
                if (error) {
                    coreStatusRef.current.setStatus(-1)
                    console.error(error)
                } else {

                    console.log(resp)
                    
                    var getTaskResult = (param_t) => {

                        let retry = param_t['retry']
                        let task_id = param_t['task_id']

                        sendCmdToCore(client, coreStatusRef, { 'cmd': 'get_task_result', 'task_id': task_id }, (error, resp) => {
                            console.log('retry: ' + retry)
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
                                    if (retry < 30 * 10) { // timeout: 30s
                                        setTimeout(getTaskResult, 100, { retry: retry + 1, task_id: task_id })
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

                    for(let i=0; i<1; i++){
                        setTimeout(() => {
                            getTaskResult({ retry: 0, task_id: resp['task_id'] })
                        }, i*100 + 100); 
                    }
                }
            })

        }, 100)

      }}>test</button>
    </>
  )
  
}

export default PreviewImage
