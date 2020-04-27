import React, { useState, useEffect } from "react"
import { sendCmdToCore } from '../common/utils'

const PreviewImage = ({ langFont, client, coreStatusRef }) => {

  const [imageNode, setImageNode] = useState()

  return (
    <>
      {imageNode}
      <button onClick={()=>{
          console.log(client)
          var param = {
            'type': 'bw',
            'src': 'I:\\work\\WORK\\MangaPrettier\\core\\test-sample\\MachikadoMazoku_02.jpg',
            'effects': [
              //{ 'mode': 'multiply', 'opacity': .8 },
              //{ 'mode': 'multiply', 'opacity': .8 },
              { 'mode': 'multiply', 'opacity': .8 }
            ],
            'show': false
          }

          coreStatusRef.current.setStatus(1)
          
          sendCmdToCore(client, coreStatusRef, 'run_task', param, (error, resp) => {
            if (error) {
              coreStatusRef.current.setStatus(-1)
              console.error(error)
            } else {
              coreStatusRef.current.setStatus(0)
              console.log(resp)
              const base64Img = resp['img']
              //console.log(base64Img)
              setImageNode(<img src={`data:image/png;base64,${base64Img}`} alt='demo'/>)
            }
          })
          
      }}></button>
    </>
  )
  
}

export default PreviewImage
