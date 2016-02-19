window.PhotoStats = React.createClass({
    getData()
    {
    	var s = squel
            .select()
            .field("COUNT(images.id_local)")
            .field("AVG(IFNULL(images.rating, 0))")
            .field("AVG(images.rating)")
            .from("Adobe_images", "images")
            .left_join("AgHarvestedExifMetadata", "exif", "images.id_local = exif.image")
            .left_join("AgLibraryKeywordImage", "keyword", "images.id_local = keyword.image");


        _.forOwn(_.omitBy(this.props.filter, _.isUndefined), function(value, key){
        	s.where(Utilities.getFilterExpression(key, value))
        })

        var query = s.toString();

        var now = new Date();
        this.props.handleProgress("start");
        var data = this.props.db.exec(query);
        this.props.handleProgress("end");
        this.props.handleStatusChange("Last query (" + query + ") took " + (new Date() - now) + " miliseconds.", "none")
        return {
        	count: data[0].values[0][0],
        	avgRatingAll: data[0].values[0][1],
            avgRatingRated: data[0].values[0][2],
        }
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
						<th>Count</th>
						<th>Average Rating (all)</th>
                        <th>Average Rating (rated)</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>{stats.count}</td>
						<td>{stats.avgRatingAll}</td>
                        <td>{stats.avgRatingRated}</td>
					</tr>
				</tbody>
			</table>
		)
	}
})