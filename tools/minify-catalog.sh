for lrtcat; do
	newName="{$lrcat%.lrcat}-minified.png"
	cm "$lrcat" "$newName"
	if [[ "$OSTYPE" == "linux-gnu" ]]; then
		./sqlite3-linux "$newName" ".read minify-catalog.sql"
	elif [[ "$OSTYPE" == "darwin"* ]]; then
		./sqlite3-osx "$newName" ".read minify-catalog.sql"
    fi
done
exit 0