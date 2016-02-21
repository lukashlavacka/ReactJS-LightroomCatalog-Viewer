window.TableViewer = React.createClass({
    handleFieldChange: function(type, field) {
    	switch(type) {
    		case "xField":    		
	        this.setState({
	            xField : field
	        })
	        break;
		case "yField":    		
	        this.setState({
	            yField : field
	        })
	        break;
    	}
    },
    getInitialState: function() {
        return {
            xField : "exif.isoSpeedRating",
            yField : "images.rating"
        }
    },
    render: function() {
        if(this.state.xField && this.state.yField)
            var table = <Table worker={this.props.worker} filter={this.props.filter} xField={this.state.xField} yField={this.state.yField} handleStatusChange={this.props.handleStatusChange} />
        return (
            <div>
            	<FieldSelector field={this.state.xField} name="x agregate field" otherField={this.state.yField} handleFieldChange={this.handleFieldChange.bind(this, "xField")} />
            	<FieldSelector field={this.state.yField} name="y agregate field" otherField={this.state.xField} handleFieldChange={this.handleFieldChange.bind(this, "yField")} />
                {table}
            </div>
        )
    }
})

var FieldSelector = React.createClass({
	agragateFields: [
		{ field: "camera.value", name: "Camera" },
		{ field: "lens.value", name: "Lens" },
		{ field: "exif.focalLength", name: "Focal length" },
		{ field: "exif.isoSpeedRating", name: "ISO" },
		{ field: "exif.aperture", name: "Aperture" },
        { field: "exif.shutterSpeed", name: "Shutter Speed" },
		{ field: "images.pick", name: "Flag" },
		{ field: "images.colorLabels", name: "Color label" },
		{ field: "images.rating", name: "Rating" },
		{ field: "keyword.tag", name: "Face" },
		{ field: "strftime('%Y', images.captureTime)", name: "Year" },
		{ field: "strftime('%Y-%m', images.captureTime)", name: "Month" },
		{ field: "strftime('%Y-%W', images.captureTime)", name: "Week" },
		{ field: "strftime('%Y-%m-%d', images.captureTime)", name: "Day" },
	],
	handleChange(event) {
		this.props.handleFieldChange(event.target.value)
	},
	render: function() {
		var otherFields = _.reject(this.agragateFields, { field : this.props.otherField })
		return (
			<BootstrapRow>
				<div>
					<h3>Select {this.props.name}</h3>
		            {otherFields.map(function(f){
		                return (
		                        <label key={f.field} className="radio-inline"><input type="radio" checked={this.props.field === f.field} value={f.field} onChange={this.handleChange} />{f.name}</label>
		                )
		            }.bind(this))}
	            </div>
	        </BootstrapRow>
		);
	}
});

var Table = React.createClass({
	getData(properties) {
        this.setState({loading: true})
		properties = properties || this.props;

        var s = squel
            .select()
            .field(properties.xField)
            .field(properties.yField)
            .field("COUNT(images.id_local)")
            .field("AVG(IFNULL(images.rating, 0))")
            .from("Adobe_images", "images")
            .left_join("AgHarvestedExifMetadata", "exif", "images.id_local = exif.image")
            .left_join("AgLibraryKeywordImage", "keyword", "images.id_local = keyword.image")
            .left_join("AgInternedExifCameraModel", "camera", "exif.cameraModelRef = camera.id_local")
            .left_join("AgInternedExifLens", "lens", "exif.lensRef = lens.id_local")
            .where(properties.xField + " IS NOT NULL")
            .where(properties.yField + " IS NOT NULL")


        _.forOwn(_.omitBy(properties.filter, _.isUndefined), function(value, key){
        	s.where(Utilities.getFilterExpression(key, value))
        })

        s = s
            .order(properties.xField)
            .order(properties.yField)
        	.group(properties.xField)
        	.group(properties.yField)

        var query = s.toString();

        var now = new Date();

        return properties.worker.exec(query).then(function(data){
	        properties.handleStatusChange("Last query (" + query + ") took " + (new Date() - now) + " miliseconds.", "none")

	        return Q(data[0] && data[0].values);
        }.bind(this))

    },
    getInitialState() {
    	return {
    		data: undefined
    	};
    },
    componentDidMount() {        
        this.getData().then(function(data){
            this.setState({
            	loading: false,
            	data : data
            })
        }.bind(this))
    },
    componentWillReceiveProps(nextProps) {
        this.getData(nextProps).then(function(data){
            this.setState({data : data})
        }.bind(this))
    },
	render() {
		return (
			<LoadingWrapper loading={this.state.loading}>
				<TableComponent data={this.state.data} xField={this.props.xField} yField={this.props.yField}/>
			</LoadingWrapper>
		);
	}
})

var TableComponent = React.createClass({
	transformData() {
		var uniqueX = _(this.props.data)
			.map(function(r){ return r[0]})
			.uniq()
			.value()
			.sort(this.correctSort(this.props.xField))

		var uniqueY = _(this.props.data)
			.map(function(r){ return r[1]})
			.uniq()
			.value()
			.sort(this.correctSort(this.props.yField))

		var maxCount = _(this.props.data)
			.map(function(r) {return r[2]})
			.max()

		var maxAverage = _(this.props.data)
			.map(function(r) {return r[3]})
			.max()

		return {
			uniqueX : uniqueX,
			uniqueY : uniqueY,
			maxCount : maxCount,
			maxAverage : maxAverage
		}
	},
	correctSort: function(field)
	{
		switch(field){
			case "numeric":
			case "exif.focalLength":
			case "exif.isoSpeedRating":
			case "exif.aperture":
			case "images.rating":
				return (function(a,b) { return a-b; });
		}
	},
	findByXY(xVal, yVal, maxCount, maxAverage) {
		var row = _.find(this.props.data, function(r){
			return r[0] === xVal && r[1] === yVal;
		})

		var count = row && row[2] ? row[2] : 0
		var avergeRating = row && row[3] ? row[3] : 0

		return {
			count: count,
			rating: avergeRating,
			relCount: count / maxCount,
			relRating: avergeRating / maxAverage
		}
	},
	render() {		
		if(!this.props.data)
			return null;
		var transformedData = this.transformData()
		return (
			<div className="table-responsive">
				<table className="table table-condensed table-col-hover table-bordered">
					<thead>
						<tr>				
							<th></th>		
							{transformedData.uniqueX.map(function(xVal){
								return (<th key={xVal}>{xVal}</th>)
							}.bind(this))}
						</tr>
					</thead>
					<tbody>
						{transformedData.uniqueY.map(function(yVal){
							return (<tr key={yVal}>
								<th>{yVal}</th>
								{transformedData.uniqueX.map(function(xVal){
									var val = this.findByXY(xVal, yVal, transformedData.maxCount, transformedData.maxAverage)
									var style = {
									    backgroundColor: "hsla(0, 0%, " + Math.round(val.relCount * 100) + "%, 0.05)"
									}
									return (<td key={yVal + "_" + xVal} style={style} title={val.rating}>{val.count}</td>)
								}.bind(this))}
							</tr>)
						}.bind(this))}
					</tbody>
				</table>
			</div>
		);
	}
})