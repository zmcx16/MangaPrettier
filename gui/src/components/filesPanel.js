import React, { useState, useRef, useEffect, useCallback } from 'react'
import Button from '@material-ui/core/Button'
import ImageIcon from '@material-ui/icons/Image'
import FolderIcon from '@material-ui/icons/Folder'
import DeleteIcon from '@material-ui/icons/Delete'
import { cyan } from '@material-ui/core/colors'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { FixedSizeList } from 'react-window';

import filesPanelStyle from "./filesPanel.module.scss"

const electron = window.require('electron')
const ipc = electron.ipcRenderer
const shortid = window.require('shortid')

function FilesPanel({ filesPanelRef, previewImagePanelAPI, settingPanelAPI}) {

  const fileList = useRef([])
  const fileListRef = useRef(null)
  const selectedFile = useRef({})

  const renderFileList = ()=>{
    return <FixedSizeList height={400} width={'auto'} itemSize={46} itemCount={fileList.current.length}>
      {renderRow}
    </FixedSizeList>
  }

  const renderRow = ({ index, style }) => (
    <ListItem button style={style} key={shortid.generate()} className={index % 2 ? filesPanelStyle.listItemOdd : filesPanelStyle.listItemEven} onClick={() => {
      let selectedTarget = fileList.current[index]
      selectedFile.current = selectedTarget['images'][Math.floor(Math.random() * selectedTarget['images'].length)]
      let imageWithEffect = {}
      imageWithEffect['image'] = selectedFile.current
      imageWithEffect['effects'] = settingPanelAPI.getEffectsParam()
      previewImagePanelAPI.renderImageNode(imageWithEffect)
    }}>
      <ListItemText className={filesPanelStyle.listItemText} primary={fileList.current[index]['path'] + ' (' + fileList.current[index]['images'].length + ')'}/>
      <ListItemIcon className={filesPanelStyle.listDeleteIcon} onClick={() => {
        fileList.current.splice(index, 1)
        setFileListNodes(renderFileList())
      }}>
        <DeleteIcon />
      </ListItemIcon>
    </ListItem>
  )

  // filesPanel API
  filesPanelRef.current.getSelectedFile = () => {
    return selectedFile.current
  }

  const [fileListNodes, setFileListNodes] = useState(renderFileList())

  return (
    <div className={filesPanelStyle.filesPanel}>
      <MuiThemeProvider theme={createMuiTheme({ palette: { primary: { main: '#5381ff'}, secondary: cyan } })}>
        <div className={filesPanelStyle.toolBar}>
          <Button
            variant="contained"
            color="primary"
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
            color="primary"
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