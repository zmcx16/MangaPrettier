import React, { useState, useRef, useEffect, useCallback } from 'react'
import Button from '@material-ui/core/Button'
import ImageIcon from '@material-ui/icons/Image'
import FolderIcon from '@material-ui/icons/Folder'
import DeleteIcon from '@material-ui/icons/Delete'
import { blue, cyan } from '@material-ui/core/colors'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { FixedSizeList } from 'react-window';

import filesPanelStyle from "./filesPanel.module.scss"

const electron = window.require('electron')
const ipc = electron.ipcRenderer

function FilesPanel({ filesPanelRef, previewImagePanelAPI}) {

  const fileList = useRef([])
  const fileListRef = useRef(null)
  const panelHeight = useRef(200)

  const renderFileList = useCallback(()=>{
    return <FixedSizeList height={panelHeight.current} width={'auto'} itemSize={46} itemCount={fileList.current.length}>
      {renderRow}
    </FixedSizeList>
  }, [panelHeight])

  const renderRow = ({ index, style }) => (
    <ListItem button style={style} key={index} className={index % 2 ? filesPanelStyle.listItemOdd : filesPanelStyle.listItemEven} >
      <ListItemText className={filesPanelStyle.listItemText} primary={fileList.current[index]['path'] + ' (' + fileList.current[index]['images'].length + ')'} onClick={() => {
        console.log(fileList.current[index])
        console.log(previewImagePanelAPI)
        previewImagePanelAPI.renderImageNode(fileList.current[index])
      }}/>
      <ListItemIcon className={filesPanelStyle.listDeleteIcon} onClick={() => {
        fileList.current.splice(index, 1)
        setFileListNodes(renderFileList())
      }}>
        <DeleteIcon />
      </ListItemIcon>
    </ListItem>
  )

  filesPanelRef.current.resizeFileList = () => {
    panelHeight.current = fileListRef.current.clientHeight
    setFileListNodes(renderFileList())
  }

  const [fileListNodes, setFileListNodes] = useState(renderFileList())

  return (
    <div className={filesPanelStyle.filesPanel}>
      <MuiThemeProvider theme={createMuiTheme({ palette: { primary: cyan, secondary: blue } })}>
        <div className={filesPanelStyle.toolBar}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<FolderIcon />}
            onClick={useCallback(()=>{
              var material_info = ipc.sendSync('getImagesInfo', true);
              if (material_info){
                console.log(material_info)
                fileList.current = fileList.current.concat(material_info)
                console.log(fileList.current)
                setFileListNodes(renderFileList())
              }
            }, [fileList])}
          >Folder</Button>
          <div></div>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ImageIcon />}
            onClick={useCallback(() => {
              var material_info = ipc.sendSync('getImagesInfo', false);
              if (material_info) {
                console.log(material_info)
                fileList.current = fileList.current.concat(material_info)
                console.log(fileList.current)
                setFileListNodes(renderFileList())
              }
            }, [fileList])}
          >Image</Button>
          <ImageIcon color="primary" style={{ fontSize: 28 }} />
          <div></div>
          <span className={filesPanelStyle.imgCnt}>X {fileList.current.reduce((acc, cur) => acc + cur['images'].length, 0)}</span>
          <div></div>
        </div>
        <div className={filesPanelStyle.fileList} ref={fileListRef}>
          {fileListNodes}
        </div>
      </MuiThemeProvider>
    </div>
  )
}

export default FilesPanel