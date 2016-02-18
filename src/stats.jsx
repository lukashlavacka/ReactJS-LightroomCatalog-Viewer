window.PhotoStats = React.createClass({
    getData()
    {
    	var s = squel
            .select()
            .field("COUNT(images.id_local)")
            .field("AVG(IFNULL(images.rating, 0))")
            .from("Adobe_images", "images")
            .left_join("AgHarvestedExifMetadata", "exif", "images.id_local = exif.image")
            .left_join("AgLibraryKeywordImage", "keyword", "images.id_local = keyword.image");


        _.forOwn(this.props.filter, function(value, key){
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
        	avgRating: data[0].values[0][1],
        }
    },
    // shouldComponentUpdate(nextProps, nextState) {
    // 	return !_.isEqual(this.props.filter, nextProps.filter);
    // },
	render() {
		var stats = this.getData();
		return(
            <div {...this.props}>
                <h2 className="react-grid-item-drag-handle">Statistics</h2>
    			<table className="table">
    				<thead>
    					<tr>
    						<th>Count</th>
    						<th>Average Rating</th>
    					</tr>
    				</thead>
    				<tbody>
    					<tr>
    						<td>{stats.count}</td>
    						<td>{stats.avgRating}</td>
    					</tr>
    				</tbody>
    			</table>
            </div>
		)
	}
})