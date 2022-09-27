<div id="badges">
  <a href="https://www.linkedin.com/in/vasilev-vitalii/">
    <img src="https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Badge"/>
  </a>
</div>

# ![logo](/public/icons/favicon-128x128.png) sadap

**Semi-automatic data processing for Microsoft SQL Server.**
Desktop app for Windows and Linix. Can load data from external sources (now supported only xlsx) and generate script for process data

## 1. getting started

From https://drive.google.com/drive/folders/1aV5WlCVjpNoPfHiv1ggvwywSz4dPiRV0?usp=sharing download this compiled app for windows or linux.
Unzip and run

## 2. how it works

1. Open XLSX file
2. Generate basic mapping "column in import file" = "column is mssql temporary table"
3. Set first loaded row
4. **_optional_** Set last loaded row
5. **_optional_** Customize mapping "column in import file" = "column is mssql temporary table"
6. **_optional_** Write additional sql script, which will be run after the temporary table is loaded
7. **_optional_** Save settings for future use. Saving first and last row, mappings and additional sql script
8. Generate script

If you have a previously saved settings file

1. Open XLSX file
2. Open saved settings file
3. Generate script

![ui1](/public/forReadme/001.png)
![ui2](/public/forReadme/002.png)
