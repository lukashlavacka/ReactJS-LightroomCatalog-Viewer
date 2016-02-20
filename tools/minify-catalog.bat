Setlocal EnableDelayedExpansion
for %%F in (*.lrcat) do (
	set name=%%~nF-minified%%~xF
	copy "%%F" "!name!"
	start "" /wait sqlite3-win.exe "!name!" ".read minify-catalog.sql"
)
endlocal