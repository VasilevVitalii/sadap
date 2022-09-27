import { contextBridge } from 'electron'
import { dialog } from '@electron/remote'
import fs from 'fs'
import exceljs from 'exceljs'
import { shell } from 'electron'
import path from 'path'
import { dateFormat as VV_dateFormat } from 'vv-common'

contextBridge.exposeInMainWorld('electronApi', {
    fsParseXlsx: async (fullFileName: string) => {
        const workbook = new exceljs.Workbook()
        await workbook.xlsx.readFile(fullFileName)
        return workbook
    },
    fsReadStream: (fullFileName: string) => {
        return fs.createReadStream(fullFileName)
    },
    fsDialogOpen: async (
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
    fsDialogSave: async (
        title?: string | undefined,
        defaultPath?: string | undefined,
        filters?: Electron.FileFilter[] | undefined,
        properties?: ('showHiddenFiles' | 'createDirectory' | 'treatPackageAsDirectory' | 'dontAddToRecent' | 'showOverwriteConfirmation')[] | undefined
    ) => {
        const response = await dialog.showSaveDialog({
            title,
            filters,
            properties,
            defaultPath
        })
        return response.filePath
    },
    fsWriteFile: async (fullFileName: string, data: string) => {
        return new Promise((resolve, reject) => {
            fs.writeFile(fullFileName, data, { encoding: 'utf8' }, (error: Error | null) => {
                if (error) return reject(error)
                resolve(undefined)
            })
        })
    },
    fsLoadFile: async (fullFileName: string) => {
        return new Promise((resolve, reject) => {
            fs.readFile(fullFileName, 'utf-8', (error, data) => {
                if (error) return reject(error)
                resolve(data)
            })
        })
    },
    fsPathParse: (fullFileName: string): path.ParsedPath => {
        return path.parse(fullFileName)
    },
    openUrl(url: string) {
        shell.openExternal(url)
    },
    VV_dateFormat(date: Date, format: string): string {
        return VV_dateFormat(date, format)
    }
})
