import React, { useState, useRef, useEffect, useCallback } from 'react'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import DeleteIcon from '@material-ui/icons/Delete'
import { blue, lightBlue } from '@material-ui/core/colors'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import LinearProgress from '@material-ui/core/LinearProgress'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'

import settingPanelStyle from "./settingPanel.module.scss"


function SettingPanel({ settingPanelRef, filesPanelAPI, previewImagePanelAPI}) {

  const argsList = useRef([
    { name: 'oox1', text: 'aabbbcc', value: {} },
    { name: 'oox', text: 'aabbbcc', value: {} },
    { name: 'oox', text: 'aabbbcc', value: {} },
    { name: 'oox', text: 'aabbbcc', value: {} },
  ])

  const [progressBar, setProgressBar] = useState(30);

  const renderArgsList = ()=>{
    return argsList.current.map((value, index) => {
      return (
        <ListItem key={index} className={index % 2 ? settingPanelStyle.listItemOdd : settingPanelStyle.listItemEven}>
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
            <Button variant="contained" color="primary" className={settingPanelStyle.button}>Add</Button>
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
      </MuiThemeProvider>
    </div>
  )
}

export default SettingPanel