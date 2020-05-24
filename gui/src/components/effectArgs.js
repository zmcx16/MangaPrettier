import React, { useState, useCallback } from 'react'

import ImageEnhance from './effects/imageEnhance'
import Blend from './effects/blend'

function EffectArgs({ renderEffectArgsFunc, effectType, settingPanelRef, filesPanelAPI, previewImagePanelAPI }) {

  return ((effectType === 'multiply' || effectType === 'soft_light') ? 
    <Blend effectType={effectType} settingPanelRef={settingPanelRef} filesPanelAPI={filesPanelAPI} previewImagePanelAPI={previewImagePanelAPI} /> : 
    (effectType === 'brightness' || effectType === 'color' || effectType === 'contrast' || effectType === 'sharpness') ? 
    <ImageEnhance effectType={effectType} settingPanelRef={settingPanelRef} filesPanelAPI={filesPanelAPI} previewImagePanelAPI={previewImagePanelAPI} /> :
    <></>)
}

export default EffectArgs