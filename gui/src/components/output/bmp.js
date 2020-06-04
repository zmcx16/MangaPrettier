import React, { useRef } from 'react'

function BMP({ configRef }) {

  const outputRef = useRef({ format: 'BMP'})
  configRef.current.output = outputRef.current

  return (<></>)
}

export default BMP