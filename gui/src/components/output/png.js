import React, { useState, useRef } from 'react'
import Typography from '@material-ui/core/Typography'
import Slider from '@material-ui/core/Slider'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import { FormattedMessage, useIntl } from "react-intl"

import PNGStyle from "./png.module.scss"

function PNG({ configRef }) {

  const intl = useIntl()

  const outputRef = useRef(configRef.current.output.format === 'PNG' ? configRef.current.output : { format: 'PNG', compress_level: 6, optimize: false })
  configRef.current.output = outputRef.current

  const [clDisable, setClDisable] = useState(outputRef.current.optimize)

  return (
    <div>
      <Typography id={"compress_level-slider"} gutterBottom>
        <FormattedMessage id={"setting.output.png.compress_level"} />
      </Typography>
      <Slider
        defaultValue={75}
        getAriaValueText={(value) => { return value }}
        aria-labelledby={"compress_level-slider"}
        valueLabelDisplay="auto"
        step={1}
        marks={[{ value: 0, label: '0' }, { value: 6, label: '6' }, { value: 9, label: '9' }]}
        min={0}
        max={9}
        onChangeCommitted={(event, value) => {
          outputRef.current.compress_level = value
          configRef.current.output = outputRef.current
        }}
        disabled={clDisable}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={outputRef.current.optimize}
            onChange={(event)=>{
              outputRef.current.optimize = event.target.checked
              configRef.current.output = outputRef.current

              setClDisable(outputRef.current.optimize)
            }}
            name="optimize"
            color="primary"
          />
        }
        label={intl.formatMessage({ id: 'setting.output.png.optimize' })}
      />
    </div>
  )
}

export default PNG