import React, { useState, useCallback } from 'react'

import Blend from './effects/blend'

function EffectArgs({ renderEffectArgsFunc, effectType, settingPanelRef, filesPanelAPI, previewImagePanelAPI }) {
/*
  const [effectNode, setEffectNode] = useState(<Blend effectType={effectType} settingPanelRef={settingPanelRef} filesPanelAPI={filesPanelAPI} previewImagePanelAPI={previewImagePanelAPI} />)

  renderEffectArgsFunc.current = (type)=>{
    setEffectNode(<Blend effectType={type} settingPanelRef={settingPanelRef} filesPanelAPI={filesPanelAPI} previewImagePanelAPI={previewImagePanelAPI} />)
  }
*/
  return (
    <Blend effectType={effectType} settingPanelRef={settingPanelRef} filesPanelAPI={filesPanelAPI} previewImagePanelAPI={previewImagePanelAPI} />
  )
}

export default EffectArgs