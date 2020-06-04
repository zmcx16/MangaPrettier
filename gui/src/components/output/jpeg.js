import React, { useState, useRef } from 'react'
import Typography from '@material-ui/core/Typography'
import Slider from '@material-ui/core/Slider'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import { FormattedMessage, useIntl } from "react-intl"

import JPEGStyle from "./jpeg.module.scss"

function JPEG({ configRef }) {

  const intl = useIntl()

  const outputRef = useRef(configRef.current.output.format === 'JPEG' ? configRef.current.output : { format: 'JPEG', quality: 75, optimize: true })
  configRef.current.output = outputRef.current

  return (
    <div>
      <Typography id={"quality-slider"} gutterBottom>
        <FormattedMessage id={"setting.output.jpeg.quality"} />
      </Typography>
      <Slider
        defaultValue={75}
        getAriaValueText={(value) => { return value }}
        aria-labelledby={"quality-slider"}
        valueLabelDisplay="auto"
        step={1}
        marks={[{ value: 0, label: '0' }, { value: 75, label: '75' }, { value: 95, label: '95' }]}
        min={0}
        max={95}
        onChangeCommitted={(event, value) => {
          outputRef.current.quality = value
          configRef.current.output = outputRef.current
        }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={outputRef.current.optimize}
            onChange={(event)=>{
              outputRef.current.optimize = event.target.checked
              configRef.current.output = outputRef.current
            }}
            name="optimize"
            color="primary"
          />
        }
        label={intl.formatMessage({ id: 'setting.output.jpeg.optimize' })}
      />
    </div>
  )
}

export default JPEG