var FilterFactory = React.createFactory(React.createClass({
	getData() {
		var s = squel
            .select()
            .field(this.props.valueProp || "id_local", "value")
            .field(this.props.nameProp || "value", "name")
            .from(this.props.table)

        if(this.props.filter)
            s = s.where(this.props.filter);

        var query = s.toString();
        var data = this.props.db.exec(query);
        return data[0].values.map(function(t){ return { value: t[0], name: t[1] } });
	},
    handleChange(event) {
        this.props.handleFilterChange(this.props.type, this.refs[this.props.type].getCheckedValues())
    },
    transformName(name){
    	if(_.isFunction(this.props.transformName))
    		return this.props.transformName(name);
    	return name;
    },
	getInitialState() {
		return {
			options: []
		}
	},
    componentDidMount() {
        var options = [];
        if(this.props.table && this.props.db){
            options = this.getData()
        }
        else if(this.props.options) {
            options = this.props.options
        }
        this.setState({
            options: options
        })        
    },
    render() {
        return (
            <form>
                <CheckboxGroup name={this.props.type} ref={this.props.type} onChange={this.handleChange} >
                    {this.state.options.map(function(o){
                        return <label key={o.value} className="checkbox-inline"><input type="checkbox" value={o.value} />{this.transformName(o.name)}</label>
                    }.bind(this))}
                </CheckboxGroup>
            </form>
        );
    }
}))

var FilterRangeFactory = React.createFactory(React.createClass({
	getData() {
		var s = squel
            .select()
            .field("MIN(" + this.props.field + ")")
            .field("MAX(" + this.props.field + ")")
            .from("AgHarvestedExifMetadata")
            .where(this.props.field + " > 0")
        var query = s.toString();
        var data = this.props.db.exec(query);

        return {
        	min: data[0].values[0][0],
        	max: data[0].values[0][1]
        };
	},
    handleChange(value) {
    	var dbVal = value.map(this.transformFromUIValue);
    	this.setState({
    		dbMinVal: dbVal[0],
    		dbMaxVal: dbVal[1],
    		uiMin: value[0],
    		uiMax: value[1]
    	})
        this.props.handleFilterChange(this.props.type, dbVal)
    },
    transformFromDBValue(value, isMin) {
    	if(_.isFunction(this.props.transformFromDBValue))
    		return this.props.transformFromDBValue(value, isMin);
    	return value;
    },
    transformFromUIValue(value) {
    	if(_.isFunction(this.props.transformFromUIValue))
    		return this.props.transformFromUIValue(value);
    	return value;
    },
    transformFromUIName(value) {
        if(_.isFunction(this.props.transformFromUIName))
            return this.props.transformFromUIName(value);
        if(_.isFunction(this.props.transformFromUIValue))
            return this.props.transformFromUIValue(value);
        return value;
    },
	getInitialState() {
		return {
			dbMin: undefined,
			dbMax: undefined,
			uiMin: undefined,
			uiMax: undefined,
			dbMinVal: undefined,
			dbMaxVal: undefined
		}
	},
    componentDidMount() {
        var dbMinMax = {};
        if(this.props.field && this.props.db){
            dbMinMax = this.getData()
        }
        else if(this.props.minMax) {
            dbMinMax = this.props.minMax
        }

    	this.setState({
    		dbMin: dbMinMax.min,
    		dbMax: dbMinMax.max,
    		dbMinVal: dbMinMax.min,
    		dbMaxVal: dbMinMax.max,
    		uiMin: this.transformFromDBValue(dbMinMax.min, true),
    		uiMax: this.transformFromDBValue(dbMinMax.max)
    	})
    },
    shouldComponentUpdate(nextProps, nextState) {
    	return this.state.dbMin !== nextState.dbMin
    		|| this.state.dbMax !== nextState.dbMax
    		|| this.state.uiMin !== nextState.uiMin
    		|| this.state.uiMax !== nextState.uiMax
    	 	|| this.props.db !== nextProps.db
    	 	|| this.props.aditionalType !== nextProps.aditionalType
    },
    componentWillReceiveProps(nextProps) {
    	if(this.props.aditionalType !== nextProps.aditionalType) {
    		var uiMin = this.transformFromDBValue(Math.max(this.state.dbMinVal, this.state.dbMin), true);
    		var uiMax = this.transformFromDBValue(Math.min(this.state.dbMaxVal, this.state.dbMax));

    		var uiDbMin = this.transformFromUIValue(uiMin);
    		var uiDbMax = this.transformFromUIValue(uiMax);

    		this.setState({
    			uiMin: uiMin,
    			uiMax: uiMax,
    			dbMinVal: uiDbMin,
    			dbMaxVal: uiDbMax,
    		})
    		this.props.handleFilterChange(this.props.type, [uiDbMin, uiDbMax])
    	}
    },
    render() {
    	if(typeof(this.state.dbMin) === "undefined")
    		return null;
    	if(this.state.dbMin === this.state.dbMax)
    		return (
    			<span>Only one value available {this.state.dbMin}</span>
			)
        return (
            <div>
                <ReactSlider
                    value={[this.state.uiMin, this.state.uiMax]}
                    min={this.transformFromDBValue(this.state.dbMin, true)}
                    max={this.transformFromDBValue(this.state.dbMax)}
                    onChange={this.handleChange}
                    pearling={true}
                    withBars
                >
                    <div>{this.transformFromUIName(this.state.uiMin)}</div>
                    <div>{this.transformFromUIName(this.state.uiMax)}</div>
                </ReactSlider>
            </div>
        );
    }
}))

window.FilterCamera = React.createClass({
    render() {
        return (
            <FilterFactory type="camera" table="AgInternedExifCameraModel" {...this.props} />
        );
    }
})

window.FilterLens = React.createClass({
	transformName(name){
		if(name === "DT 0mm F0 SAM")
			return "Unknown"
		return name;
	},
    render() {
        return (
            <FilterFactory type="lens" table="AgInternedExifLens" transformName={this.transformName} {...this.props} />
        );
    }
})

window.FilterFocalLength = React.createClass({
	render() {
        return (
            <FilterRangeFactory type="focalLength" field="focalLength" {...this.props} />
        );
    }
})

window.FilterISORating = React.createClass({
	transformFromUIValue(value) {
		return Math.pow(2, value) * 100;
	},
	transformFromDBValue(value) {
		return Math.log((value / 100)) / Math.log(2)
	},
	render() {
        return (
            <FilterRangeFactory type="iso" field="isoSpeedRating" transformFromDBValue={this.transformFromDBValue} transformFromUIValue={this.transformFromUIValue} {...this.props} />
        );
    }
})

window.FilterAperture = React.createClass({
	transformFromUIValue(value) {
		if(this.state.type === "Continuous")
			return value / 10;
		
		return this.types[this.state.type][value]
	},
	transformFromDBValue(value, isFirst) {
		if(this.state.type === "Continuous")
			return isFirst ? Math.floor(value * 10) : Math.ceil(value * 10);

		return _.findIndex(this.types[this.state.type], function(v){
			return value < v;
		}) - (isFirst ? 1 : 0);
	},
	handleChange(event) {
		this.setState({
			type: event.target.value
		})
	},
	types: {
		Full: [0.5, 0.7, 1.0, 1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32],
		Half: [0.7, 0.8, 1.0, 1.2, 1.4, 1.7, 2, 2.4, 2.8, 3.3, 4, 4.8, 5.6, 6.7, 8, 9.5, 11, 13, 16, 19, 22, 27, 32],
		Third: [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5, 4, 4.5, 5.0, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22, 25, 29, 32],
		Continuous: []
	},
	getInitialState() {
		return {
			type: "Continuous"
		}
	},
	render() {
        return (
        	<div>
	            <FilterRangeFactory type="aperture" field="aperture" transformFromDBValue={this.transformFromDBValue} transformFromUIValue={this.transformFromUIValue} aditionalType={this.state.type} {...this.props}/>	            
	        	{_.keys(this.types).map(function(key){
	            return (
	                <div key={key} className="radio-inline">
	                    <label><input type="radio" checked={this.state.type === key} value={key} onChange={this.handleChange} />{key}</label>
	                </div>
	            )}.bind(this))}
            </div>
        );
    }
})

window.FilterFlag = React.createClass({
    options: [
        { value: 0, name: "None"},
        { value: -1, name: "Rejected"},
        { value: 1, name: "Selected"}
    ],
    render() {
        return (
            <FilterFactory type="flag" options={this.options} {...this.props}/>
        );
    }
})

window.FilterColor = React.createClass({
    options: [
        { value: "", name: "None"},
        { value: "Red", name: "Red"},
        { value: "Yellow", name: "Yellow"},
        { value: "Green", name: "Green"},
        { value: "Blue", name: "Blue"},
        { value: "Purple", name: "Purple"}
    ],
    render() {
        return (
            <FilterFactory type="color" options={this.options} {...this.props}/>
        );
    }
})

window.FilterRating = React.createClass({
    options: [
        { value: 0, name: "unrated" },
        { value: 1, name: "1 star" },
        { value: 2, name: "2 star" },
        { value: 3, name: "3 star" },
        { value: 4, name: "4 star" },
        { value: 5, name: "5 star" }
    ],
    minMax: {
        min: 0,
        max: 5
    },
    transformFromUIName(value) {
        return _.find(this.options, {value : value}).name
    },
    render() {
        return (
            <FilterRangeFactory type="rating" minMax={this.minMax} transformFromUIName={this.transformFromUIName} {...this.props}/>
        );
    }
})

window.FilterFace = React.createClass({
    render() {
        return (
            <FilterFactory type="face" table="AgLibraryKeyword" filter="keywordType = 'person'" nameProp="Name" {...this.props} />
        );
    }
})

window.FilterDate = React.createClass({
    getData() {
        var s = squel
            .select()
            .field("MIN(captureTime)")
            .field("MAX(captureTime)")
            .from("Adobe_images")

        var query = s.toString();
        var data = this.props.db.exec(query);
        return {
            min: data[0].values[0][0],
            max: data[0].values[0][1]
        };
    },
    handleChange(otherDate, isStart, thisDate) {
        if(isStart){
            this.setState({ startDate: thisDate})
        }
        else {
            this.setState({ endDate: thisDate})
        }

        this.props.handleFilterChange("date", isStart ? [ thisDate, otherDate ] : [ otherDate, thisDate ])
    },
    getInitialState() {
        return {
            min: moment().subtract(1, 'month'),
            max: moment().add(1, 'month'),
            startDate: moment().subtract(1, 'month'),
            endDate: moment().add(1, 'month')
        }
    },
    componentDidMount() {
        var data = this.getData()
        this.setState({
            min: moment(data.min),
            max: moment(data.max),
            startDate: moment(data.min),
            endDate: moment(data.max)
        })        
    },
    render() {
        var style = {
            width: "50%",
            float: "left"
        }
        return (
            <div>
                <div style={style}>
                    <span>From</span>
                    <DatePicker
                        selected={this.state.startDate}
                        startDate={this.state.startDate}
                        endDate={this.state.endDate}
                        onChange={this.handleChange.bind(null, this.state.endDate, true)}
                        minDate={this.state.min} 
                        maxDate={this.state.max} />
                </div>
                <div style={style}>
                    <span>To</span>
                    <DatePicker
                        selected={this.state.endDate}
                        startDate={this.state.startDate}
                        endDate={this.state.endDate}
                        onChange={this.handleChange.bind(null, this.state.statDate, false)}
                        minDate={this.state.min} 
                        maxDate={this.state.max} />
                </div>
          </div>
        );
    }
})