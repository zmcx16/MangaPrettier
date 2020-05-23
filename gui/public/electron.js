// def
const USER_DATA = 'user_data'
const CONFIG_FILE_NAME = 'config.json'

// Module
const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu

const isDev = require('electron-is-dev')
const os = require('os')
const fs = require('fs')
const path = require('path')
const child_process = require('child_process')
const detect_port = require('detect-port')
const ipc = electron.ipcMain

const app_path = app.getAppPath()
const platform = os.platform()
var core_proc = null

var root_path = ''
var user_data_path = ''

// config
var config = {}


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow
var aboutWindow

function genMenuTemplate(lang){

  return [{
    label: 'zh-TW' ? '選單' : 'Menu',
    submenu: [
      {
        label: lang === 'zh-TW' ? '語系' : 'Language',
        submenu: [
          {
            label: 'English',
            click: () => {
              config['lang'] = 'en'
              saveDataSync(CONFIG_FILE_NAME, config)
              Menu.setApplicationMenu(Menu.buildFromTemplate(genMenuTemplate(config['lang'])))
              mainWindow.webContents.send('setLang', 'en')
            }
          },
          {
            label: '繁體中文',
            click: () => {
              config['lang'] = 'zh-TW'
              saveDataSync(CONFIG_FILE_NAME, config)
              Menu.setApplicationMenu(Menu.buildFromTemplate(genMenuTemplate(config['lang'])))
              mainWindow.webContents.send('setLang', 'zh-TW')
            }
          }
        ]
      },
      { 
        label: lang === 'zh-TW' ? '關於 MangaPrettier' : 'About MangaPrettier',
        click: () => {
          if (!aboutWindow) {
            console.log('open about Window')
            aboutWindow = new BrowserWindow({
              icon: path.join(__dirname, 'MangaPrettier.png'),
              webPreferences: {
              nodeIntegration: true
              },
              width: 640, height: 320
            })

            aboutWindow.loadURL(isDev ? 'http://localhost:3000/about.html' : `file://${path.join(__dirname, '../build/about.html')}`)
            aboutWindow.on('closed', () => {
              aboutWindow = null
            })
            aboutWindow.removeMenu()
          }
        }
      },
      {
        label: lang === 'zh-TW' ? '除錯視窗' : 'Debug Console',
        click: () => { 
          if (mainWindow != null && mainWindow.isFocused())
          mainWindow.webContents.openDevTools()
        }
      },
      { 
        label: lang === 'zh-TW' ? '結束' : 'Quit',
        click: () => { quitAll() }
      }
    ]
  }] 
}

function createWindow() {

    // OnStart
    if (app_path.indexOf('default_app.asar') !== -1)  //dev mode
        root_path = path.resolve(path.dirname(app_path), '..', '..', '..', '..')
    else  //binary mode
        root_path = path.resolve(path.dirname(app_path), '..')

    if (platform === 'linux') {
        const homedir = os.homedir()
        user_data_path = path.join(homedir, '.MangaPrettier', USER_DATA)
    } else {
        user_data_path = path.join(root_path, USER_DATA)
    }


    if (!fs.existsSync(user_data_path)) {
        fs.mkdirSync(user_data_path, { recursive: true })
    }

    let config_default = {
      heartbeat: 500,
      preview_timeout: 30000,
      lang: 'zh-TW'
    }

    //config = loadDataSync(CONFIG_FILE_NAME)
    if (Object.keys(config).length === 0) {
      config = Object.assign({}, config_default)
      //saveDataSync(CONFIG_FILE_NAME, config)
    }else{
      if (!('heartbeat' in config)){
        config['heartbeat'] = config_default['heartbeat']
        //saveDataSync(CONFIG_FILE_NAME, config)
      }
      if (!('preview_timeout' in config)) {
        config['preview_timeout'] = config_default['preview_timeout']
        //saveDataSync(CONFIG_FILE_NAME, config)
      }
      if (!('lang' in config)){
        config['lang'] = config_default['lang']
        //saveDataSync(CONFIG_FILE_NAME, config)
      }
    }

    console.log(config)

    Menu.setApplicationMenu(Menu.buildFromTemplate(genMenuTemplate(config['lang'])))

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1024, 
        height: 600,
        icon: path.join(__dirname, 'MangaPrettier.png'),
        webPreferences: {
            nodeIntegration: true
        }
    })

    // and load the index.html of the app.
    mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`)
	
    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

    // for core process
    let port_candidate = 7777
    detect_port(port_candidate, (err, _port) => {
        if (err) {
            console.log(err)
        }

        if (port_candidate === _port) {
            console.log(`port: ${port_candidate} was not occupied`)
            config['port'] = port_candidate
        } else {
            console.log(`port: ${port_candidate} was occupied, try port: ${_port}`)
            config['port'] = _port
        }

        
        console.log('platform:' + platform, ', dir path:' + __dirname)
        let script = path.join(path.resolve(__dirname, '..', '..'), 'core', 'src', 'mpcore.py')

        if (!fs.existsSync(script)) {
            if (platform === 'win32') {
                script = path.join(path.resolve(__dirname, '..'), 'core', 'mpcore.exe')
            } else if (platform === 'linux') {
                script = path.join(path.resolve(__dirname, '..'), 'core', 'mpcore')
            }
            core_proc = child_process.execFile(script, ['-port', config['port']])

        } else {
            core_proc = child_process.spawn('python', [script, '-port', config['port']])
        }
        
    })

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('will-quit', () => {
    killCore()
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

ipc.on('navExec', (event, target) => {
  if (platform == 'win32') {
    child_process.execSync('start ' + target)
  } else if (platform == 'darwin') {
    child_process.execSync('open ' + target)
  } else if (platform == 'linux') {
    child_process.execSync('xdg-open ' + target)
  }
})

// common function
function walkSync(dir, filelist) {
    var path = path || require('path')
    var fs = fs || require('fs'), files = fs.readdirSync(dir)
    filelist = filelist || []
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist)
        }
        else {
            filelist.push(path.join(dir, file))
        }
    })
    return filelist
}

function type_check(file_path, filter){
  var ret = false
  filter.some(function (ext) {
    if (file_path.toLowerCase().indexOf(ext.toLowerCase()) === file_path.length - ext.length) {
      ret = true
      return true
    } else {
      return false
    }
  })

  return ret
}

function saveDataSync(file_name, target_data){
  console.log('save ' + file_name)
  fs.writeFileSync(path.join(user_data_path, file_name), JSON.stringify(target_data), 'utf8')
}

function loadDataSync(file_name) {
  console.log('load ' + file_name)
  let output = ''
  let file_path = path.join(user_data_path, file_name)
  if (fs.existsSync(file_path)) {
    let data = fs.readFileSync(file_path, 'utf8')
    output = JSON.parse(data)
  }

  return output
}

function quitAll() {
    app.quit()
    app.exit(0)
}

function killCore() {
    console.log('kill core process')
    if (core_proc)
        core_proc.kill()
    core_proc = null
}

// ipc register
ipc.on('getConfig', (event) => {
    event.sender.send('getConfig_callback', config)
})


ipc.on('getImagesInfo', (event, isFolder) => {

  const { dialog } = require('electron')
  const images_filter_list = ['png', 'bmp', 'jpg']
  const filter_list = images_filter_list
  
  var material_list = []
  if (isFolder){
    var foldlist = dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'multiSelections']
    })

    if (foldlist){
      var filelist_temp = []
      foldlist.forEach(function (item) {
        walkSync(item, filelist_temp)
      })

      var images = []
      filelist_temp.forEach(function (file_path) {
        if (type_check(file_path, images_filter_list)){
          images.push(file_path)
        }
      })

      foldlist.forEach(function (fold_path) {
        material_list.push({ 'path': fold_path, 'size': 0, 'type': 'folder', 'images': images })
      })
    }

  }else{
    var filelist = dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Image', extensions: filter_list }]
    })

    if (filelist) {
      filelist.forEach(function (file_path) {
        const stats = fs.statSync(file_path)
        var type = ''
        if (type_check(file_path, images_filter_list)){
          type = 'image'
        }

        material_list.push({ 'path': file_path, 'size': stats.size, 'type': type, 'images': [file_path]})
      })
    }
  }

  event.returnValue = material_list
  
})


ipc.on('importEffects', (event) => {

  const { dialog } = require('electron')
  
  let effects = {}
  let data = null
  try {
    var path = dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'effect', extensions: ['json'] }]
    })

    if (path && path.length > 0) {
      data = fs.readFileSync(path[0], 'utf8')
      effects = JSON.parse(data)
    }
  }
  catch (e) {
      console.log(e)
      event.returnValue = { ret: -1, exception: e.toString(), data: data, path: path }
  }

  event.returnValue = {ret: 0, data: effects}

})

ipc.on('exportEffects', (event, data) => {

  const { dialog } = require('electron')

  try {
      var path = dialog.showSaveDialog(mainWindow, {
      title: 'save effects setting', 
      filters: [{ name: 'effect', extensions: ['json'] }]
    })
    
    if(path){
      fs.writeFileSync(path, JSON.stringify(data), 'utf8')
    }
  }
  catch (e) {
    console.log(e)
    event.returnValue = { ret: -1, exception: e.toString() }
  }

  event.returnValue = {ret: 0}

})