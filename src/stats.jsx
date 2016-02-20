window.PhotoStats = React.createClass({
    popularStats: [
        { key: "camera", field: "camera.value", name: "Camera Model" },
        { key: "lens", field: "lens.value", name: "Lens" },
        { key: "focalLength", field: "exif.focalLength", name: "Focal Length" },
        { key: "aperture", field: "ROUND(exif.aperture, 2)", name: "Aperture" },
        { key: "iso", field: "exif.isoSpeedRating", name: "ISO" },
        { key: "shutter", field: "exif.shutterSpeed", name: "Shutter Speed",
            transform: function(val) {
                if(val > 0) {
                    return "1/" + Math.round(100 / val)
                }
                else {
                    return (1 / Math.round(100 / val)) + "s"
                }
            }
        }
    ],
    getData()
    {
        // var baseStat = squel
        //     .select()
        //     .field("COUNT(images.id_local)")
        //     .field("AVG(IFNULL(images.rating, 0))")
        //     .from("Adobe_images", "images")
        //     .left_join("AgHarvestedExifMetadata", "exif", "images.id_local = exif.image")
        //     .left_join("AgLibraryKeywordImage", "keyword", "images.id_local = keyword.image");
        // _.forOwn(_.omitBy(this.props.filter, _.isUndefined), function(value, key){
        //     s.where(Utilities.getFilterExpression(key, value))
        // })

        var queries = this.popularStats.map(function(s){
            var statQuery = squel
                .select()
                .field(s.field)
                .field("COUNT(images.id_local)")
                .from("Adobe_images", "images")
                .left_join("AgHarvestedExifMetadata", "exif", "images.id_local = exif.image")
                .left_join("AgLibraryKeywordImage", "keyword", "images.id_local = keyword.image")
                .left_join("AgInternedExifCameraModel", "camera", "exif.cameraModelRef = camera.id_local")
                .left_join("AgInternedExifLens", "lens", "exif.lensRef = lens.id_local")
                .group(s.field)
                .order("COUNT(images.id_local)", false)
                .limit(1)

            _.forOwn(_.omitBy(this.props.filter, _.isUndefined), function(value, key){
                statQuery.where(Utilities.getFilterExpression(key, value))
            }.bind(this))

            return statQuery;
        }.bind(this))

        var query = queries.join(";");

        var now = new Date();
        this.props.handleProgress("start");
        var data = this.props.db.exec(query);
        this.props.handleProgress("end");
        this.props.handleStatusChange("Last query (" + query + ") took " + (new Date() - now) + " miliseconds.", "none")

        return data.map(function(d, i){
            var stat = this.popularStats[i];
            return { key: stat.key, name: stat.name, value: _.isFunction(stat.transform) ? stat.transform(d.values[0][0]) : d.values[0][0], count: d.values[0][1] }
        }.bind(this));
    },
    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(_.omitBy(this.props.filter, _.isUndefined), _.omitBy(nextProps.filter, _.isUndefined));
    },
    render() {
        var stats = this.getData();
        return(
            <table className="table">
                <thead>
                    <tr>
                        {stats.map(function(s){
                            return (<th key={s.key}>{s.name}</th>)
                        }.bind(this))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        {stats.map(function(s){
                            return (<td key={s.key}>{s.value} [{s.count} photo(s)]</td>)
                        }.bind(this))}
                    </tr>
                </tbody>
            </table>
        )
    }
})