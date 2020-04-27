
// zerorpc function
export function sendCmdToCore(client, coreStatusRef, cmd, msg, callback) {
  //console.log('sendCmdToCore: ' + cmd)
  coreStatusRef.current.setStatus(1)
  client.invoke(cmd, msg, (error, res) => {
    callback(error, res)
  })
}