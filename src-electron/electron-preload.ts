import { contextBridge } from 'electron'
import { dialog } from '@electron/remote'
import fs from 'fs'
import exceljs from 'exceljs'
import { shell } from 'electron'

contextBridge.exposeInMainWorld('electronApi', {
    fsParseXlsx: async (fullFileName: string) => {
        const workbook = new exceljs.Workbook()
        await workbook.xlsx.readFile(fullFileName)
        return workbook
    },
    fsReadStream: (fullFileName: string) => {
        return fs.createReadStream(fullFileName)
    },
    fsDialog: async (
        title?: string | undefined,
        defaultPath?: string | undefined,
        filters?: Electron.FileFilter[] | undefined,
        properties?:
            | (
                  | 'openFile'
                  | 'openDirectory'
                  | 'multiSelections'
                  | 'showHiddenFiles'
                  | 'createDirectory'
                  | 'promptToCreate'
                  | 'noResolveAliases'
                  | 'treatPackageAsDirectory'
                  | 'dontAddToRecent'
              )[]
            | undefined
    ) => {
        const response = await dialog.showOpenDialog({
            title,
            filters,
            properties,
            defaultPath
        })
        return response.filePaths
    },

    openUrl(url: string) {
        shell.openExternal(url)
    }
})
