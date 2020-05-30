import React, { useState, useCallback } from 'react'

import Levels from './effects/levels'
import ImageEnhance from './effects/imageEnhance'
import Blend from './effects/blend'

function EffectArgs({ effectType, settingPanelRef, filesPanelAPI, previewImagePanelAPI, appAPI }) {

  return ((effectType === 'levels') ?
    <Levels effectType={effectType} settingPanelRef={settingPanelRef} filesPanelAPI={filesPanelAPI} previewImagePanelAPI={previewImagePanelAPI} appAPI={appAPI} /> : 
    (effectType === 'blend') ? 
    <Blend effectType={effectType} settingPanelRef={settingPanelRef} filesPanelAPI={filesPanelAPI} previewImagePanelAPI={previewImagePanelAPI} /> : 
    (effectType === 'image_enhance') ? 
    <ImageEnhance effectType={effectType} settingPanelRef={settingPanelRef} filesPanelAPI={filesPanelAPI} previewImagePanelAPI={previewImagePanelAPI} /> :
    <></>)
}

export default EffectArgs