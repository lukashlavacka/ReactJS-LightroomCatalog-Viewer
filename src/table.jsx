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
            xField : "",
            yField : ""
        }
    },
    render: function() {
        if(this.state.xField && this.state.yField)
            var table = <Table db={this.props.db} filter={this.props.filter} xField={this.state.xField} yField={this.state.yField} handleStatusChange={this.props.handleStatusChange} handleProgress={this.props.handleProgress} />
        return (
            <div {...this.props}>
            	<h2 className="react-grid-item-drag-handle">Table</h2>
            	<FieldSelector field={this.state.xField} name="x agregate field" otherField={this.state.yField} handleFieldChange={this.handleFieldChange.bind(this, "xField")} />
            	<FieldSelector field={this.state.yField} name="y agregate field" otherField={this.state.xField} handleFieldChange={this.handleFieldChange.bind(this, "yField")} />
                {table}
            </div>
        )
    }
})

var FieldSelector = React.createClass({
	agragateFields: [
		{ field: "exif.cameraModelRef", name: "Camera"},
		{ field: "exif.lensRef", name: "Lens"},
		{ field: "exif.focalLength", name: "Focal length"},
		{ field: "exif.isoSpeedRating", name: "ISO"},
		{ field: "exif.aperture", name: "Aperture"},
		{ field: "images.pick", name: "Flag"},
		{ field: "images.colorLabels", name: "Color label"},
		{ field: "images.rating", name: "Rating"},
		{ field: "keyword.tag", name: "Face"}
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
	getData() {
        var s = squel
            .select()
            .field(this.props.xField)
            .field(this.props.yField)
            .field("COUNT(images.id_local)")
            .field("AVG(IFNULL(images.rating, 0))")
            .from("Adobe_images", "images")
            .left_join("AgHarvestedExifMetadata", "exif", "images.id_local = exif.image")
            .left_join("AgLibraryKeywordImage", "keyword", "images.id_local = keyword.image")
            .where(this.props.xField + " IS NOT NULL")
            .where(this.props.yField + " IS NOT NULL")


        _.forOwn(this.props.filter, function(value, key){
        	s.where(Utilities.getFilterExpression(key, value))
        })

        s = s
            .order(this.props.xField)
            .order(this.props.yField)
        	.group(this.props.xField)
        	.group(this.props.yField)

        var query = s.toString();

        var now = new Date();
        this.props.handleProgress("start");
        var data = this.props.db.exec(query);
        this.props.handleProgress("end");
        this.props.handleStatusChange("Last query (" + query + ") took " + (new Date() - now) + " miliseconds.", "none")
        
        var rawData = data[0];

        if(!rawData)
        	return        

        return rawData.values;

    },
	render() {
		var data = this.getData()
		if(!data)
			return null;
		return (
			<TableComponent data={data} />
		);
	}
})

var TableComponent = React.createClass({
	transformData() {
		var uniqueX = _(this.props.data)
			.map(function(r){ return r[0]})
			.uniq()
			.value()
			.sort(function(a,b) { return a-b; })

		var uniqueY = _(this.props.data)
			.map(function(r){ return r[1]})
			.uniq()
			.value()
			.sort(function(a,b) { return a-b; })

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