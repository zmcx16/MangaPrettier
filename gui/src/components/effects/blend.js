import React, { useState, useRef } from 'react'
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';

import blendStyle from "./blend.module.scss"

function Blend({ effectType, settingPanelRef, filesPanelAPI, previewImagePanelAPI}) {

  const argsRef = useRef()
  argsRef.current = { type: 'bw', mode: effectType, opacity: .8 }
  settingPanelRef.current.setArgsRef(argsRef.current)

  return (
    <div className={blendStyle.root}>
      <Typography id="opacity-slider" gutterBottom>
        Opacity
      </Typography>
      <Slider
        defaultValue={settingPanelRef.current.getArgsRef().opacity}
        getAriaValueText={(value) => { return value }}
        aria-labelledby="opacity-slider"
        valueLabelDisplay="auto"
        step={0.01}
        marks={[{value: 0,label: '0'}, {value: 1,label: '1'}]}
        min={0}
        max={1}
        onChangeCommitted={(event, value) => { 
          settingPanelRef.current.setArgsRef({
            ...argsRef.current,
            ['opacity']: value,
          })

          const selectedFile = filesPanelAPI.getSelectedFile()
          const image = Object.keys(selectedFile).length === 0 ? null : selectedFile
          if (image){
            let imageWithEffect = {}
            imageWithEffect['image'] = image
            imageWithEffect['effects'] = settingPanelRef.current.getEffectsParam().concat(settingPanelRef.current.getArgsRef())
            
            console.log(imageWithEffect)
            previewImagePanelAPI.renderImageNode(imageWithEffect)
          }
          
        }}
      />
    </div>
  )
}

export default Blend