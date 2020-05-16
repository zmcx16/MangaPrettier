import React from 'react'

// zerorpc function
export function sendCmdToCore(client, msg, callback) {
  //console.log('sendCmdToCore: ' + cmd)
  client.invoke('run_task', msg, (error, res) => {
    callback(error, res)
  })
}
