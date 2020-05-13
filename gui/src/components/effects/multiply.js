import React, { useState } from 'react'
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';

import multiplyStyle from "./multiply.module.scss"

function Multiply({argsRef}) {

  argsRef.current = { mode: 'multiply', opacity: .8 }
  console.log(argsRef.current)

  return (
    <div className={multiplyStyle.root}>
      <Typography id="opacity-slider" gutterBottom>
        Opacity
      </Typography>
      <Slider
        defaultValue={argsRef.current.opacity}
        getAriaValueText={(value) => { return value }}
        aria-labelledby="opacity-slider"
        valueLabelDisplay="auto"
        step={0.01}
        marks={[{value: 0,label: '0'}, {value: 1,label: '1'}]}
        min={0}
        max={1}
        onChange={(event, value) => { argsRef.current.opacity = value }}
      />
    </div>
  )
}

export default Multiply