# Catalog minification tools

Simple tools to remove unecessary data from Lightroom catalog to prevent memory issues with large catalogs.

## Usage

Drop catalog in the same folder and run batch or shell script

## How it works

Scripts renames all files ending with `.lrcat` to `-minified.lrcat`. Then in calls sqlite3, opens the renamed catalog and executed `minify-catalog.sql`. If you don't trust the executables you can replace them with compiled binaries from [sqlite website](https://sqlite.org/download.html), just keep the names the same. The sql script just drops some uneccessary tables for analysis and calls `VACUUM` that removes empty data from the file and therefore makes the catalog much smaller. I tested with 300MB catalog that was minified to 35MB.

## Uses
Uses binary files from [sqlite website](https://sqlite.org/download.html). No other dependency