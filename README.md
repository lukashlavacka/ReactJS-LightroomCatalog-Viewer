# React.js Lightroom catalog reader

Drop Lightroom catalog file and UI should update.

## Demo

[lukashlavacka.github.io/ReactJS-LightroomCatalog-Viewer](//lukashlavacka.github.io/ReactJS-LightroomCatalog-Viewer)

## TODO

- [x] Add various exif filters (camera, lens, ISO, focal length, aperture, ...)
- [x] Add various metadata filters (rating, person, color, album, ...)
- [x] Show basic statistics
- [x] Select agregate field(s) for chart
- [x] Chart rendering
- [ ] Multiple chart rendering
- [x] Make it work when saving locally (Ctrl+S) (Release or branch `static`)
- [x] Create some analytics engine providing suggestions


## References

*	Uses [kripken/sql.js](//github.com/kripken/sql.js) library as SQLite reader
*	Uses [ziad-saab/react-checkbox-group](//github.com/ziad-saab/react-checkbox-group) for column selection
*	Uses [hiddentao/squel](//github.com/hiddentao/squel) as SQL query builder
*	Uses [nnnick/Chart.js](//github.com/nnnick/Chart.js) as charting library
*	Uses [jerairrest/react-chartjs-2](//github.com/jerairrest/react-chartjs-2) as React Chart.js 2 wrapper
*	Uses [mpowaga/react-slider](//github.com/mpowaga/react-slider) for sliders
*	Uses [rstacruz/nprogress](//github.com/rstacruz/nprogress) as unobstrusive progress indicator
*	Uses [STRML/react-grid-layout](//github.com/STRML/react-grid-layout) as grid system