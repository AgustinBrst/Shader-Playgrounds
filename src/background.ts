"use strict"

import { FILE_EXTENSION } from "./constants"
import { app, protocol, dialog, Menu, BrowserWindow, ipcMain as ipc } from "electron"
import { createProtocol, installVueDevtools } from "vue-cli-plugin-electron-builder/lib"
import { ShaderType } from "./scripts/renderer/_constants"
import menu from "./menu"

const isDevelopment = process.env.NODE_ENV !== "production"
protocol.registerStandardSchemes( [ "app" ], { secure: true } ) // Standard scheme must be registered before the app is ready
app.commandLine.appendSwitch( "--ignore-gpu-blacklist" ) // Chrome by default black lists certain GPUs because of bugs.

// Window Management 🖼

const playgroundWindows: Set <BrowserWindow> = new Set()

function newPlaygroundWindow( filePath?: string ) {
    const window = new BrowserWindow( {
        show: false,
        width: 1000,
        height: 700,
        backgroundColor: "#3c3c3c", // rgb(60, 60, 60)
        titleBarStyle: "hidden",
        webPreferences: { experimentalFeatures: true }
    } )

    loadWindowContents( window, "playground" )

    // Window lifecycle

    window.on( "close", ( event ) => {
        event.preventDefault()
        window.webContents.send( "close" )
    } )

    window.webContents.on( "did-finish-load", () => {
        if ( filePath ) {
            window.webContents.send( "open", filePath )
        } else {
            window.webContents.send( "new" )
        }
    } )

    playgroundWindows.add( window )
}

ipc.on( "close-window", ( event: any, proceed: boolean ) => {
    console.log( "closing!" )

    const window = BrowserWindow.fromWebContents( event.sender )

    if ( proceed ) {
        playgroundWindows.delete( window )
        window.destroy()

        // if the window closing was due to a "quit" command and
        // this was the last window, quit the app.
        if ( appQuitting && playgroundWindows.size === 0 ) {
            app.quit()
        }
    } else {
        // cancel app quitting (if in process)
        appQuitting = false
    }
} )

// App lifecycle 🔄

let appQuitting = false

app.on( "ready", async() => {
    if ( isDevelopment && ! process.env.IS_TEST ) {
        await installVueDevtools()
    }

    Menu.setApplicationMenu( menu )

    openFile()
} )

app.on( "window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if ( process.platform !== "darwin" ) {
        app.quit()
    }
} )

app.on( "activate", () => {
    // 📝 mostrar la ventana de bienvenida si no hay ninguna abierta
    if ( playgroundWindows.size === 0 ) {
        openFile()
    }
} )

app.on( "before-quit", () => {
    // register start of quitting process
    appQuitting = true
} )

// Utils 🛠

function loadWindowContents( window: BrowserWindow, type: "playground" | "welcome" ) {
    if ( process.env.WEBPACK_DEV_SERVER_URL ) {
        // Load the url of the dev server if in development mode
        window.loadURL( process.env.WEBPACK_DEV_SERVER_URL + type + ".html" )
    } else {
        // Load the index.html when not in development
        createProtocol( "app" )
        window.loadURL( `app://./${type}.html` )
    }
}

function showOpenFileDialog() {
    app.focus() // los 'dialogs' por defecto no ponen a la aplicacion en foco y pueden terminan atras de otras ventanas

    const filePaths = dialog.showOpenDialog( {
        properties: [ "openFile" ],
        title: "Open file",
        filters: [
            { name: "Shaders Playground", extensions: [ FILE_EXTENSION ] }
        ]
    } )

    return filePaths ? filePaths[ 0 ] : undefined
}

function openFile() {
    const filePath = showOpenFileDialog()

    if ( filePath !== undefined ) {
        newPlaygroundWindow( filePath )
    }
}

function newFile() {
    newPlaygroundWindow()
}

function saveFile( focusedWindow: BrowserWindow | undefined ) {
    if ( focusedWindow ) { // ⚠️ ¿ no habria que ver que la enfocada sea una de las "playground" ?
        focusedWindow.webContents.send( "save" )
    }
}

function clearRecents() {
    app.clearRecentDocuments()
}

function activeShader( focusedWindow: BrowserWindow | undefined, shader: ShaderType ) {
    if ( focusedWindow ) {
        focusedWindow.webContents.send( "shader", shader )
    }
}

function compileAndRun( focusedWindow: BrowserWindow | undefined ) {
    if ( focusedWindow ) {
        focusedWindow.webContents.send( "compileAndRun" )
    }
}

export {
    openFile,
    newFile,
    saveFile,
    activeShader,
    compileAndRun,
    clearRecents
}

// Exit cleanly on request from parent process in development mode.

if ( isDevelopment ) {
    if ( process.platform === "win32" ) {
        process.on( "message", ( data ) => {
            if ( data === "graceful-exit" ) {
                app.quit()
            }
        } )
    } else {
        process.on( "SIGTERM", () => {
            app.quit()
        } )
    }
}
