<div id="badges">
  <a href="https://www.linkedin.com/in/vasilev-vitalii/">
    <img src="https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Badge"/>
  </a>
  <a href="https://www.youtube.com/channel/UChlSfeGAF1fTDwu6-5b3dnQ">
    <img src="https://img.shields.io/badge/YouTube-red?style=for-the-badge&logo=youtube&logoColor=white" alt="Youtube Badge"/>
  </a>
</div>

# sadap

**Semi-automatic data processing for Microsoft SQL Server.**
Can load data from external sources (now supported only xlsx) and generate script for process data

## 1. getting started

From https://drive.google.com/drive/folders/1aV5WlCVjpNoPfHiv1ggvwywSz4dPiRV0?usp=sharing download this compiled app for windows or linux.
Unzip and run

## 2. how it works

1. Open XLSX file
2. Set first use row and (if nessesary) last row
3. Customize mapping "column in import file" = "column is mssql temporary table"
4. Write (if nessesary) additional sql script, which will be run after the temporary table is loaded
5. Save (if nessesary) mapping columns and script for future use
6. Generate script

![ui1](/public/forReadme/001.png)
![ui2](/public/forReadme/002.png)
