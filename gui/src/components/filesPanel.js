import React, { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button'
import ImageIcon from '@material-ui/icons/Image'
import FolderIcon from '@material-ui/icons/Folder'
import DeleteIcon from '@material-ui/icons/Delete'
import { blue } from '@material-ui/core/colors'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { FixedSizeList } from 'react-window';

import filesPanelStyle from "./filesPanel.module.scss"

function FilesPanel() {

  var fileList = Array.from({ length: 100 }, (v, k) => k + 1)

  const renderRow = ({ index, style }) => (
    <ListItem button style={style} key={index} className={index % 2 ? filesPanelStyle.listItemOdd : filesPanelStyle.listItemEven} >
      <ListItemText primary={fileList[index]} />
      <ListItemIcon className={filesPanelStyle.listDeleteIcon} onClick={() => {
        fileList.splice(index, 1)
        setFileListNodes(<FixedSizeList height={400} width={'100%'} itemSize={46} itemCount={fileList.length}>
          {renderRow}
        </FixedSizeList>)
      }}>
        <DeleteIcon />
      </ListItemIcon>
    </ListItem>
  )

  const [fileListNodes, setFileListNodes] = useState(
    <FixedSizeList height={400} width={'100%'} itemSize={46} itemCount={fileList.length}>
      {renderRow}
    </FixedSizeList>
  )


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
        <div className={filesPanelStyle.fileList}>
          {fileListNodes}
        </div>
      </MuiThemeProvider>
    </div>
  )
}

export default FilesPanel