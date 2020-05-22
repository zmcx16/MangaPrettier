import React, { useState, useCallback } from 'react'

import Blend from './effects/blend'

function EffectArgs({ renderEffectArgsFunc, effectType, settingPanelRef, filesPanelAPI, previewImagePanelAPI }) {

  return (
    <Blend effectType={effectType} settingPanelRef={settingPanelRef} filesPanelAPI={filesPanelAPI} previewImagePanelAPI={previewImagePanelAPI} />
  )
}

export default EffectArgs