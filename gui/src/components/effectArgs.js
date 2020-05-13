import React, { useState, useRef } from 'react'

import Multiply from './effects/multiply'

function EffectArgs({ effectType, argsRef }) {

  return (
    <Multiply argsRef={argsRef}/>
  )
}

export default EffectArgs