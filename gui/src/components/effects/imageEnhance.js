import React, { useState, useRef } from 'react'
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import InputLabel from '@material-ui/core/InputLabel'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import { FormattedMessage, useIntl } from "react-intl"

import imageEnhanceStyle from "./imageEnhance.module.scss"

const shortid = window.require('shortid')

function ImageEnhance({ effectType, settingPanelRef, filesPanelAPI, previewImagePanelAPI}) {

  const langModeMappingTable = {
    'brightness': 'effects.arg.brightness',
    'color': 'effects.arg.color',
    'contrast': 'effects.arg.contrast',
    'sharpness': 'effects.arg.sharpness'
  }

  // lang
  const intl = useIntl()
  const getModeMappingLangID = (name)=>{
    return intl.formatMessage({ id: langModeMappingTable[name]})
  }

  const argsRef = useRef({ type: effectType, mode: 'contrast', factor: 1.0 })
  settingPanelRef.current.setArgsRef(argsRef.current)

  // mode select
  const modeTypes = useRef([
    { name: 'contrast', value: 'contrast' },
    { name: 'brightness', value: 'brightness' },
    { name: 'color', value: 'color' },
    { name: 'sharpness', value: 'sharpness' }
  ])

  const [modeSelect, setModeSelect] = useState({
    name: 'mode',
    modeType: 'contrast'
  })

  const renderArgsWoModeList = ()=>{

    const argsList = [
      { name: 'factor', l10nID: 'effects.arg.factor', default: 1.0, step: 0.01, marks: [{ value: 0, label: '0' }, { value: 2, label: '2' }], min: 0, max: 2 }
    ]
    return argsList.map((argVal, index) => {
      return (
        <div key={shortid.generate()}>
          <Typography id={argVal.name + "-slider"} gutterBottom>
            <FormattedMessage id={argVal.l10nID} />
          </Typography>
          <Slider
            defaultValue={argVal.default}
            getAriaValueText={(value) => { return value }}
            aria-labelledby={argVal.name+"-slider"}
            valueLabelDisplay="auto"
            step={argVal.step}
            marks={argVal.marks}
            min={argVal.min}
            max={argVal.max}
            onChangeCommitted={(event, value) => {
              argsRef.current[argVal.name] = value
              settingPanelRef.current.setArgsRef(argsRef.current)

              const selectedFile = filesPanelAPI.getSelectedFile()
              const image = Object.keys(selectedFile).length === 0 ? null : selectedFile
              if (image) {
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
    })
  }

  const [argsWoModeList, setArgsWoModeList] = useState(renderArgsWoModeList())

  return (
    <div className={imageEnhanceStyle.root}>
      <FormControl variant="outlined" className={imageEnhanceStyle.modeSelect}>
        <InputLabel htmlFor="mode-select"><FormattedMessage id={'effects.arg.mode'} /></InputLabel>
        <Select
          native
          value={modeSelect.modeType}
          onChange={(event) => {

            const name = event.target.name
            argsRef.current = {
              ...argsRef.current,
              factor: 1.0, mode: event.target.value
            }
            settingPanelRef.current.setArgsRef(argsRef.current)

            setModeSelect({
              ...modeSelect,
              [name]: event.target.value,
            })

            setArgsWoModeList(renderArgsWoModeList())

          }}
          label="Mode"
          inputProps={{
            name: 'modeType',
            id: 'mode-select',
          }}
        >
          {
            modeTypes.current.map((value, index) => {
              return <option key={shortid.generate()} value={value.value}>{getModeMappingLangID(value.name)}</option>
            })
          }
        </Select>
      </FormControl>
      {argsWoModeList}
    </div>
  )
}

export default ImageEnhance