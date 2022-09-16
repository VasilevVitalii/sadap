import fs from 'fs'
import exceljs from 'exceljs'

export interface ElectronApi {
    fsParseXlsx: (fullFileName: string) => Promise<exceljs.Workbook>
    fsReadStream: (fullFileName: string) => fs.ReadStream
    fsDialog: (
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
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const electronApi: ElectronApi = (window as { electronApi: ElectronApi }).electronApi
