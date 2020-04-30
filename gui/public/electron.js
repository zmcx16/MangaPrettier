// def
const USER_DATA = 'user_data'
const CONFIG_FILE_NAME = 'config.json'

// Module
const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const isDev = require('electron-is-dev')
const os = require('os')
const fs = require('fs')
const path = require('path')
const child_process = require('child_process')
const detect_port = require('detect-port')
const ipc = electron.ipcMain;

const app_path = app.getAppPath()
const platform = os.platform()
var core_proc = null

var root_path = ''
var user_data_path = ''

// render config
var render_config = {}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;

function createWindow() {

    // OnStart
    if (app_path.indexOf('default_app.asar') !== -1)  //dev mode
        root_path = path.resolve(path.dirname(app_path), '..', '..', '..', '..');
    else  //binary mode
        root_path = path.resolve(path.dirname(app_path), '..');

    if (platform === 'linux') {
        const homedir = os.homedir();
        user_data_path = path.join(homedir, '.MangaPrettier', USER_DATA);
    } else {
        user_data_path = path.join(root_path, USER_DATA);
    }


    if (!fs.existsSync(user_data_path)) {
        fs.mkdirSync(user_data_path, { recursive: true });
    }

    render_config = loadDataSync(CONFIG_FILE_NAME);
    if (Object.keys(render_config).length === 0) {
        render_config = {
            heartbeat: 300,
            preview_timeout: 30000
        }
        //saveDataSync(CONFIG_FILE_NAME, render_config)
    }

    console.log(render_config)

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1024, 
        height: 600,
        icon: path.join(__dirname, 'MangaPrettier.png'),
        webPreferences: {
            nodeIntegration: true
        }
    });

    // and load the index.html of the app.
    mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
	
    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

    // for core process
    let port_candidate = 7777;
    detect_port(port_candidate, (err, _port) => {
        if (err) {
            console.log(err);
        }

        if (port_candidate === _port) {
            console.log(`port: ${port_candidate} was not occupied`);
            render_config['port'] = port_candidate;
        } else {
            console.log(`port: ${port_candidate} was occupied, try port: ${_port}`);
            render_config['port'] = _port;
        }

        
        console.log('platform:' + platform, ', dir path:' + __dirname);
        let script = path.join(path.resolve(__dirname, '..', '..'), 'core', 'src', 'mpcore.py');

        //script = path.join(path.resolve(__dirname, '..'), 'core-win', 'mpcore.exe');
        //core_proc = child_process.execFile(script, ['-port', port]);

        if (!fs.existsSync(script)) {
            if (platform === 'win32') {
                script = path.join(__dirname, 'core-win', 'mpcore.exe');
            } else if (platform === 'linux') {
                script = path.join(__dirname, 'core-linux', 'mpcore');
            }
            core_proc = child_process.execFile(script, ['-port', render_config['port']]);

        } else {
            core_proc = child_process.spawn('python', [script, '-port', render_config['port']]);
        }
        
    });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('will-quit', () => {
    killCore();
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

// common function
function walkSync(dir, filelist) {
    var path = path || require('path');
    var fs = fs || require('fs'), files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        }
        else {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
}

function saveDataSync(file_name, target_data){
  console.log('save ' + file_name);
  fs.writeFileSync(path.join(user_data_path, file_name), JSON.stringify(target_data), 'utf8');
}

function loadDataSync(file_name) {
  console.log('load ' + file_name);
  let output = '';
  let file_path = path.join(user_data_path, file_name);
  if (fs.existsSync(file_path)) {
    let data = fs.readFileSync(file_path, 'utf8');
    output = JSON.parse(data);
  }

  return output;
}

function quitAll() {
    app.quit();
    app.exit(0);
}

function killCore() {
    console.log('kill core process');
    if (core_proc)
        core_proc.kill();
    core_proc = null;
}

// ipc register
ipc.on('getConfig', (event) => {
    event.sender.send('getConfig_callback', render_config);
});