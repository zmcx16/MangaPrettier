import React, { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button'
import ImageIcon from '@material-ui/icons/Image'
import FolderIcon from '@material-ui/icons/Folder'
import { blue } from '@material-ui/core/colors'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'

import filesPanelStyle from "./filesPanel.module.scss"

function FilesPanel() {

  return (
    <div className={filesPanelStyle.filesPanel}>
      <MuiThemeProvider theme={createMuiTheme({ palette: { secondary: blue } })}>
        <div className={filesPanelStyle.toolBar}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<FolderIcon />}
          >Folder</Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ImageIcon />}
          >Image</Button>
          <div></div>
        </div>
      </MuiThemeProvider>
    </div>
  )
}

export default FilesPanel