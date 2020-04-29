
// zerorpc function
export function sendCmdToCore(client, coreStatusRef, msg, callback) {
  //console.log('sendCmdToCore: ' + cmd)
  //coreStatusRef.current.setStatus(1)
  client.invoke('run_task', msg, (error, res) => {
    callback(error, res)
  })
}