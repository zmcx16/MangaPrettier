import React, { useState, useRef } from 'react'
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import { FormattedMessage } from "react-intl"

import imageEnhanceStyle from "./imageEnhance.module.scss"

function ImageEnhance({ effectType, settingPanelRef, filesPanelAPI, previewImagePanelAPI}) {

  const argsRef = useRef()
  argsRef.current = { type: 'image_enhance', mode: effectType, factor: 1.0 }
  settingPanelRef.current.setArgsRef(argsRef.current)

  return (
    <div className={imageEnhanceStyle.root}>
      <Typography id="opacity-slider" gutterBottom>
        <FormattedMessage id={'effects.arg.factor'} />
      </Typography>
      <Slider
        defaultValue={settingPanelRef.current.getArgsRef().factor}
        getAriaValueText={(value) => { return value }}
        aria-labelledby="opacity-slider"
        valueLabelDisplay="auto"
        step={0.01}
        marks={[{value: 0,label: '0'}, {value: 3,label: '3'}]}
        min={0}
        max={3}
        onChangeCommitted={(event, value) => { 
          settingPanelRef.current.setArgsRef({
            ...argsRef.current,
            ['factor']: value,
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

export default ImageEnhance