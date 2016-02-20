window.ChartViewer = React.createClass({
    agragateFields: [
        { field: "camera.value", name: "Camera", type: "pie"},
        { field: "lens.value", name: "Lens", type: "pie"},
        { field: "exif.focalLength", name: "Focal length", type: "bar"},
        { field: "exif.isoSpeedRating", name: "ISO", type: "bar"},
        { field: "exif.aperture", name: "Aperture", type: "bar"},
        { field: "exif.shutterSpeed", name: "Shutter Speed" , type: "bar"},
        { field: "images.pick", name: "Flag", type: "pie"},
        { field: "images.colorLabels", name: "Color label", type: "pie"},
        { field: "images.rating", name: "Rating", type: "bar"},
        { field: "keyword.tag", name: "Face", type: "pie"},
        { field: "strftime('%Y', images.captureTime)", name: "Year" , type: "bar"},
        { field: "strftime('%Y-%m', images.captureTime)", name: "Month" , type: "bar"},
        { field: "strftime('%Y-%W', images.captureTime)", name: "Week" , type: "bar"},
        { field: "strftime('%Y-%m-%d', images.captureTime)", name: "Day" , type: "bar"},
    ],
    handleFieldChange: function(fieldName) {
        this.setState({
            field : _.find(this.agragateFields, {field: fieldName })
        })
    },
    getInitialState: function() {
        return {
            field : _.find(this.agragateFields, {field: "camera.value" })
        }
    },
    render: function() {
        if(this.state.field)
            var chart = <Chart db={this.props.db} filter={this.props.filter} field={this.state.field} handleStatusChange={this.props.handleStatusChange} handleProgress={this.props.handleProgress} />
        return (
            <div>
                <FieldSelector agragateFields={this.agragateFields} field={this.state.field} handleFieldChange={this.handleFieldChange} />
                {chart}
            </div>
        )
    }
})

var FieldSelector = React.createClass({
	handleChange(event) {
		this.props.handleFieldChange(event.target.value)
	},
	render: function() {
		return (
			<BootstrapRow>
				<div>
                    <h3>Select agregate field</h3>
		            {this.props.agragateFields.map(function(f){
		                return (
		                        <label key={f.field} className="radio-inline"><input type="radio" checked={this.props.field.field === f.field} value={f.field} onChange={this.handleChange} />{f.name}</label>
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
            .field(this.props.field.field)
            .field("COUNT('images.id_local')")
            .from("Adobe_images", "images")
            .left_join("AgHarvestedExifMetadata", "exif", "images.id_local = exif.image")
            .left_join("AgLibraryKeywordImage", "keyword", "images.id_local = keyword.image")
            .left_join("AgInternedExifCameraModel", "camera", "exif.cameraModelRef = camera.id_local")
            .left_join("AgInternedExifLens", "lens", "exif.lensRef = lens.id_local");


        _.forOwn(_.omitBy(this.props.filter, _.isUndefined), function(value, key){
        	s.where(Utilities.getFilterExpression(key, value))
        })

        s = s
            .order(this.props.field.field)
        	.group(this.props.field.field)

        var query = s.toString();

        var now = new Date();
        this.props.handleProgress("start");
        var data = this.props.db.exec(query);
        this.props.handleProgress("end");
        this.props.handleStatusChange("Last query (" + query + ") took " + (new Date() - now) + " miliseconds.", "none")
        
        var rawData = data[0];
        return rawData;

    },
	render() {
		var rawData = this.getData()
		if(!rawData)
			return null;
        var chartElement;
        switch(this.props.field.type) {
            case "pie":
                chartElement = <PieChartComponent rawData={rawData} />
                break;
            case "bar":
                chartElement = <BarChartComponent rawData={rawData} />
                break;
        }
		return chartElement
	}
})

var BarChart = window.Chart.React.Bar;
var BarChartComponent = React.createClass({
    getInitialState: function()
    {
        return {
            options : {
                responsive: true
            }
        }
    },
    expandDataset: function(rawData) {
        var data = {
            labels: rawData.values.map(function(v){return v[0] || "Undefined"}),
            datasets: []
        }

        data.datasets.push({
            label: "Count",
            data: rawData.values.map(function(v){return v[1] || "Undefined"})
        })

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
        var data = this.expandDataset(this.props.rawData)
        return (
            <BootstrapRow>
                <BarChart data={data} options={this.state.options}/>
            </BootstrapRow>
        )
    }
});

var PieChart = window.Chart.React.Pie;
var PieChartComponent = React.createClass({
    getInitialState: function()
    {
        return {
            options : {
                responsive: true
            }
        }
    },
    expandDataset: function(rawData) {
        var data = rawData.values.map(function(v, i){
            var hue = i * (360 / rawData.values.length)

            return {
                label: v[0] || "Undefined",
                value: v[1],
                color: "hsl(" + hue + ",80%,50%)",
                highlight: "hsl(" + hue + ",90%,60%)"
            }
        })

        return data;
    },
    render: function() {
        var data = this.expandDataset(this.props.rawData)
        return (
            <BootstrapRow>
                <PieChart data={data} options={this.state.options}/>
            </BootstrapRow>
        )
    }
});