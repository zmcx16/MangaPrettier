import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { FormattedMessage } from "react-intl"

const CoreStatus = forwardRef((props, ref) => {
  const [value, setValue] = useState(-1);
  
  const setStatus = (status) => {
    setValue(status);
  };

  useImperativeHandle(ref, () => {
     return {
      setStatus: setStatus
     }
  });

  return (
    <>
     { value === 0 ? 'Ready' : value === 1 ? 'Progressing' : 'Failed'}
    </>
  )
});

export default CoreStatus