import React, { useState, useRef, useEffect } from 'react'
import Typography from '@material-ui/core/Typography'
import Slider from '@material-ui/core/Slider'
import InputLabel from '@material-ui/core/InputLabel'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { FormattedMessage, useIntl } from "react-intl"

import levelsStyle from "./levels.module.scss"

const shortid = window.require('shortid')


function Levels({ effectType, settingPanelRef, filesPanelAPI, previewImagePanelAPI, appAPI}) {

  const langChannelMappingTable = {
    'RGB': 'effects.arg.channel.RGB',
    'R': 'effects.arg.channel.R',
    'G': 'effects.arg.channel.G',
    'B': 'effects.arg.channel.B'
  }

  const midtonesTransMinMax = (x) => {
    return (x > 1 ? 1 - (x-1) : 1 + (1-x))
  }
 
  const argsRef = useRef({
    type: 'levels', mode: effectType,
    shadow: 0, midtones: 1.0, highlight: 255, outshadow: 0, outhighlight: 255, channel: 'RGB'
  })

  console.log(argsRef.current)

  // set current value on settingPanel
  settingPanelRef.current.setArgsRef(argsRef.current)

  // lang
  const intl = useIntl()
  const getChannelMappingLangID = (name)=>{
    return intl.formatMessage({ id: langChannelMappingTable[name]})
  }

  // channel select
  const channelTypes = useRef([
    { name: 'RGB', value: 'RGB' },
    { name: 'R', value: 'R' },
    { name: 'G', value: 'G' },
    { name: 'B', value: 'B' }
  ])

  const [channelSelect, setChannelSelect] = useState({
    name: 'channel',
    channelType: 'RGB'
  })

  // levels chart
  const imageData = useRef(previewImagePanelAPI.getImageData())
  const imageLevelDataRef = useRef(
    { 
      R: [...Array(256)].map(x => ({val: 0})),
      G: [...Array(256)].map(x => ({ val: 0 })),
      B: [...Array(256)].map(x => ({ val: 0 })),
      RGB: [...Array(256)].map(x => ({ val: 0 }))
  })

  const [imageLevelData, setImageLevelData] = useState([])
  const imageLevelObj = useRef(new Image())

  // --- get image data ----
  imageLevelObj.current.onload = function () {
    var canvas = document.createElement('canvas');
    canvas.width = imageLevelObj.current.width;
    canvas.height = imageLevelObj.current.height;

    var context = canvas.getContext('2d');
    context.drawImage(imageLevelObj.current, 0, 0);

    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    for (var x = 0; x < imageData.width; x++){
      for(var y = 0; y < imageData.height; y++){
        var index = (y * imageData.width + x) * 4;
        var red = imageData.data[index];
        var green = imageData.data[index + 1];
        var blue = imageData.data[index + 2];
        //var alpha = imageData.data[index + 3];

        imageLevelDataRef.current.R[red].val += 1 
        imageLevelDataRef.current.G[green].val += 1 
        imageLevelDataRef.current.B[blue].val += 1 
        imageLevelDataRef.current.RGB[parseInt((red + green + blue)/3)].val += 1 
      }
    }
    
    if(imageLevelData.length === 0){
      setImageLevelData(imageLevelDataRef.current.RGB)
    }
  }

  imageLevelObj.current.src = imageData.current['imageNode']
  // ----------------------

  const [levelsChart, setLevelsChart] = useState()

  // argsWithoutChannel
  const renderArgsWoChannelList = () => {

    const argsList = [
      { name: 'shadow', l10nID: 'effects.arg.shadow', default: 0, step: 1, marks: [{ value: 0, label: '0' }, { value: 255, label: '255' }], min: 0, max: 255 },
      { name: 'midtones', l10nID: 'effects.arg.midtones', default: 1.0, step: 0.01, marks: [{ value: 0.01, label: '1.99' }, { value: 1.99, label: '0.01' }], min: 0.01, max: 1.99 },
      { name: 'highlight', l10nID: 'effects.arg.highlight', default: 255, step: 1, marks: [{ value: 0, label: '0' }, { value: 255, label: '255' }], min: 0, max: 255 },
      { name: 'outshadow', l10nID: 'effects.arg.outshadow', default: 0, step: 1, marks: [{ value: 0, label: '0' }, { value: 255, label: '255' }], min: 0, max: 255 },
      { name: 'outhighlight', l10nID: 'effects.arg.outhighlight', default: 255, step: 1, marks: [{ value: 0, label: '0' }, { value: 255, label: '255' }], min: 0, max: 255 },
    ]
    return argsList.map((argVal, index) => {
      return (
        <div key={shortid.generate()} className={levelsStyle.argNode}>
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

              // --- input valid check ---
              let args_temp = Object.assign({}, argsRef.current)
              args_temp[argVal.name] = value

              let diff = args_temp.highlight - args_temp.shadow
              if (diff < 1){
                appAPI.popModalWindow(
                  <h2><FormattedMessage id={'settingPanel.add.effects.levels.sh_diff_invalid'} /></h2>
                )
                setArgsWoChannelList(renderArgsWoChannelList()) //reset args
                return
              }
              // -------------------------

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

  const [argsWoChannelList, setArgsWoChannelList] = useState(renderArgsWoChannelList())

  return (
    <div className={levelsStyle.root}>
      <div className={levelsStyle.argNode}>
        <FormControl variant="outlined" className={levelsStyle.channelSelect}>
          <InputLabel htmlFor="channel-select"><FormattedMessage id={'effects.arg.channel'} /></InputLabel>
          <Select
            native
            value={channelSelect.channelType}
            onChange={(event) => {
              const name = event.target.name
              const channel = event.target.value
              argsRef.current = {
                ...argsRef.current,
                shadow: 0, midtones: 1.0, highlight: 255, outshadow: 0, outhighlight: 255, channel: channel
              }
              settingPanelRef.current.setArgsRef(argsRef.current)

              setChannelSelect({
                ...channelSelect,
                [name]: channel,
              })

              setArgsWoChannelList(renderArgsWoChannelList())
              setImageLevelData(
                channel === 'R' ? imageLevelDataRef.current.R :
                channel === 'G' ? imageLevelDataRef.current.G :
                channel === 'B' ? imageLevelDataRef.current.B : imageLevelDataRef.current.RGB               
              )
            }}
            label="Channel"
            inputProps={{
              name: 'channelType',
              id: 'channel-select',
            }}
          >
            {
              channelTypes.current.map((value, index) => {
                return <option key={shortid.generate()} value={value.value}>{getChannelMappingLangID(value.name)}</option>
              })
            }
          </Select>
        </FormControl>
        <ResponsiveContainer>
          <AreaChart data={imageLevelData}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <Area type='monotone' dataKey='val' stroke='#8884d8' fill='#8884d8' />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {argsWoChannelList}
    </div>
  )
}

export default Levels