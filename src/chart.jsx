window.ChartViewer = React.createClass({
    handleFieldChange: function(field) {
        this.setState({
            field : field
        })
    },
    getInitialState: function() {
        return {
            field : ""
        }
    },
    render: function() {
        if(this.state.field)
            var chart = <Chart db={this.props.db} filter={this.props.filter} field={this.state.field} handleStatusChange={this.props.handleStatusChange} handleProgress={this.props.handleProgress} />
        return (
            <div>
                <FieldSelector field={this.state.field} handleFieldChange={this.handleFieldChange} />
                {chart}
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
		return (
			<BootstrapRow>
				<div>
		            {this.agragateFields.map(function(f){
		                return (
		                        <label key={f.field} className="radio-inline"><input type="radio" checked={this.props.field === f.field} value={f.field} onChange={this.handleChange} />{f.name}</label>
		                )
		            }.bind(this))}
	            </div>
	        </BootstrapRow>
		);
	}
});

var Chart = React.createClass({
    getData() {
        var s = squel
            .select()
            .field(this.props.field)
            .field("COUNT('images.id_local')")
            .from("Adobe_images", "images")
            .left_join("AgHarvestedExifMetadata", "exif", "images.id_local = exif.image")
            .left_join("AgLibraryKeywordImage", "keyword", "images.id_local = keyword.image");


        _.forOwn(this.props.filter, function(value, key){
        	s.where(Utilities.getFilterExpression(key, value))
        })

        s = s
            .order(this.props.field)
        	.group(this.props.field)

        var query = s.toString();

        var now = new Date();
        this.props.handleProgress("start");
        var data = this.props.db.exec(query);
        this.props.handleProgress("end");
        this.props.handleStatusChange("Last query (" + query + ") took " + (new Date() - now) + " miliseconds.", "none")
        
        var rawData = data[0];

        if(!rawData)
        	return

        var chartData = {
            labels: rawData.values.map(function(v){return v[0]}),
            datasets: []
        }

        chartData.datasets.push({
            label: "Count",
            data: rawData.values.map(function(v){return v[1]})
        })

        return chartData;

    },
	render() {
		var data = this.getData()
		if(!data)
			return null;
		return (
			<BarChartComponent data={data} />
		);
	}
})

var BarChart = window.Chart.React.Bar;
var BarChartComponent = React.createClass({
    getInitialState: function()
    {
        return {
            options : {
                scaleShowGridLines : true,
                responsive: true
            }
        }
    },
    expandDataset: function(data) {
        data.dataset = data.datasets.map(function(d, i) {
            var hue = i * (360 / data.datasets.length)

            d.fillColor       = "hsla(" + hue + ",90%,50%,0.5)";
            d.strokeColor     = "hsla(" + hue + ",90%,50%,0.8)";
            d.highlightFill   = "hsla(" + hue + ",90%,50%,0.75)";
            d.highlightStroke = "hsla(" + hue + ",90%,50%,1.0)";
            return d;
        })
        return data;
    },
    render: function() {
        var data = this.expandDataset(this.props.data)
        return (
            <BootstrapRow>
                <BarChart data={data} options={this.state.options}/>
            </BootstrapRow>
        )
    }
});