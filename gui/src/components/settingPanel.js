import React, { useState, useRef, useEffect, useCallback } from 'react'
import Popover from '@material-ui/core/Popover'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import DeleteIcon from '@material-ui/icons/Delete'
import { blue, lightBlue } from '@material-ui/core/colors'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import LinearProgress from '@material-ui/core/LinearProgress'
import InputLabel from '@material-ui/core/InputLabel'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'

import settingPanelStyle from "./settingPanel.module.scss"

const shortid = window.require('shortid')

function SettingPanel({ settingPanelRef, filesPanelAPI, previewImagePanelAPI}) {

  // effects list
  const argsList = useRef([
    { name: 'oox1', text: 'aabbbcc', value: {} },
    { name: 'oox', text: 'aabbbcc', value: {} },
    { name: 'oox', text: 'aabbbcc', value: {} },
    { name: 'oox', text: 'aabbbcc', value: {} },
  ])

  const renderArgsList = ()=>{
    return argsList.current.map((value, index) => {
      return (
        <ListItem key={shortid.generate()} className={index % 2 ? settingPanelStyle.listItemOdd : settingPanelStyle.listItemEven}>
          <ListItemText primary={value.name} primaryTypographyProps={{ style: ({ fontWeight: 'bold' }) }} className={settingPanelStyle.argsListName} />
          <ListItemText primary={value.text} />
          <ListItemSecondaryAction>
            <IconButton edge="end" aria-label="delete" onClick={() => {
              argsList.current.splice(index, 1)
              setArgsListNodes(renderArgsList())
            }}>
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      )
    })
  }

  const [argsListNodes, setArgsListNodes] = useState(renderArgsList())

  // progressbar
  const [progressBar, setProgressBar] = useState(30);

  // add window
  const [addWindow, setAddWindow] = useState(null);
  const addWindowClick = (event) => {
    setAddWindow(event.currentTarget)
  }

  const addWindowClose = () => {
    setAddWindow(null);
  }

  // effects select
  const [effectSelect, setEffectSelect] = useState({
    name: 'effect',
    effectType: ''
  });

  const effectSelectChange = (event) => {
    const name = event.target.name;
    setEffectSelect({
      ...effectSelect,
      [name]: event.target.value,
    });
  };

  const openAddWindow = Boolean(addWindow)
  const id_addWindow = openAddWindow ? 'addWindow' : undefined

  return (
    <div className={settingPanelStyle.settingPanel}>
      <MuiThemeProvider theme={createMuiTheme({ palette: { primary: blue, secondary: lightBlue } })}>
        <div className={settingPanelStyle.argsPanel}>
          <div className={settingPanelStyle.argsBoard}>
            <List>
              {argsListNodes}
            </List>
          </div>
          <div className={settingPanelStyle.argsButtons}>
            <Button variant="contained" color="primary" className={settingPanelStyle.button} onClick={addWindowClick}>Add</Button>
            <div></div>
            <Button variant="contained" color="primary" className={settingPanelStyle.button}>Import</Button>
            <div></div>
            <Button variant="contained" color="primary" className={settingPanelStyle.button}>Export</Button>
            <div></div>
            <LinearProgress variant="determinate" color="secondary" value={progressBar} className={settingPanelStyle.progressBar} />
            <div></div>
            <Button variant="contained" color="primary" className={settingPanelStyle.exeButton}>Start</Button>
            <div></div>
          </div>
        </div>
        <Popover
          id={id_addWindow}
          open={openAddWindow}
          anchorEl={addWindow}
          onClose={addWindowClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <div className={settingPanelStyle.addWindow}>
            <FormControl variant="outlined" className={settingPanelStyle.addWindowEffectSelect}>
              <InputLabel htmlFor="effect-select">Effects</InputLabel>
              <Select
                native
                value={effectSelect.effectType}
                onChange={effectSelectChange}
                label="Effect"
                inputProps={{
                  name: 'effectType',
                  id: 'effect-select',
                }}
              >
                <option value={'effect1'}>effect1</option>
                <option value={'effect2'}>effect2</option>
                <option value={'effect3'}>effect3</option>
              </Select>
            </FormControl>
            <div className={settingPanelStyle.addWindowEffectArgs}>
              args
            </div>
            <div className={settingPanelStyle.addWindowButtons}>
              <Button variant="contained" color="primary" className={settingPanelStyle.button} onClick={() => { }}>Ok</Button>
              <div></div>
              <Button variant="contained" color="primary" className={settingPanelStyle.button} onClick={() => { }}>Cancel</Button>
            </div>
          </div>
        </Popover>
      </MuiThemeProvider>
    </div>
  )
}

export default SettingPanel