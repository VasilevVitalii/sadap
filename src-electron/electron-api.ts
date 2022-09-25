import fs from 'fs'
import path from 'path'
import exceljs from 'exceljs'
import { QVueGlobals } from 'quasar'

export interface ElectronApi {
    fsParseXlsx: (fullFileName: string) => Promise<exceljs.Workbook>
    fsReadStream: (fullFileName: string) => fs.ReadStream
    fsDialogOpen: (
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
    ) => Promise<string[]>
    fsDialogSave: (
        title?: string | undefined,
        defaultPath?: string | undefined,
        filters?: Electron.FileFilter[] | undefined,
        properties?: ('showHiddenFiles' | 'createDirectory' | 'treatPackageAsDirectory' | 'dontAddToRecent' | 'showOverwriteConfirmation')[] | undefined
    ) => Promise<string>
    openUrl: (url: string) => undefined
    fsWriteFile: (fullFileName: string, data: string) => Promise<undefined>
    fsLoadFile: (fullFileName: string) => Promise<string>
    fsPathParse: (fullFileName: string) => path.ParsedPath
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const electronApi: ElectronApi = (window as { electronApi: ElectronApi }).electronApi
