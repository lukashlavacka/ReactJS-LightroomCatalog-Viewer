window.Filter = React.createClass({
	render() {
		return(
			<BootstrapRow wd="4" md="6">
				<FilterCamera db={this.props.db} handleFilterChange={this.props.handleFilterChange} />
				<FilterLens db={this.props.db} handleFilterChange={this.props.handleFilterChange} />
				<FilterFocalLength db={this.props.db} handleFilterChange={this.props.handleFilterChange} />
				<FilterISORating db={this.props.db} handleFilterChange={this.props.handleFilterChange} />
				<FilterAperture db={this.props.db} handleFilterChange={this.props.handleFilterChange} />
			</BootstrapRow>
		)
	}
})

var FilterFactory = React.createFactory(React.createClass({
	getData()
	{
		var s = squel
            .select()
            .field("id_local", "value")
            .field("value", "name")
            .from(this.props.table)
        var query = s.toString();
        var data = this.props.db.exec(query);
        return data[0].values.map(function(t){ return { value: t[0], name: t[1] } });
	},
    handleChange(event)
    {
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
    	this.setState({
    		options: this.getData()
    	})
    },
    render() {
        return (
            <BootstrapRow>
            	<h2>{this.props.typeDisplay}</h2>
                <form>
                    <CheckboxGroup name={this.props.type} ref={this.props.type} onChange={this.handleChange} >
                        {this.state.options.map(function(o){
                            return <label key={o.value} className="checkbox-inline"><input type="checkbox" value={o.value} />{this.transformName(o.name)}</label>
                        }.bind(this))}
                    </CheckboxGroup>
                </form>
            </BootstrapRow>
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
    	var dbMinMax = this.getData();

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
    	 	|| this.props.aditionalType !== nextProps.aditionalType;
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
    			<BootstrapRow>
            		<h2>{this.props.typeDisplay}</h2>
    				<span>Only one value available {this.state.dbMin}</span>
            	</BootstrapRow>
			)
        return (
            <BootstrapRow>
            <h2>{this.props.typeDisplay}</h2>
            	<ReactSlider
            		value={[this.state.uiMin, this.state.uiMax]}
            		min={this.transformFromDBValue(this.state.dbMin, true)}
            		max={this.transformFromDBValue(this.state.dbMax)}
            		onChange={this.handleChange}
            		pearls={true}
            		withBars
        		>
        			<div>{this.transformFromUIValue(this.state.uiMin)}</div>
        			<div>{this.transformFromUIValue(this.state.uiMax)}</div>
        		</ReactSlider>
            </BootstrapRow>
        );
    }
}))

var FilterCamera = React.createClass({
    render() {
        return (
            <FilterFactory db={this.props.db} typeDisplay="Camera" type="camera" table="AgInternedExifCameraModel" handleFilterChange={this.props.handleFilterChange} />
        );
    }
})

var FilterLens = React.createClass({
	transformName(name){
		if(name === "DT 0mm F0 SAM")
			return "Unknown"
		return name;
	},
    render() {
        return (
            <FilterFactory db={this.props.db} typeDisplay="Lens" type="lens" table="AgInternedExifLens" handleFilterChange={this.props.handleFilterChange} transformName={this.transformName} />
        );
    }
})

var FilterFocalLength = React.createClass({
	render() {
        return (
            <FilterRangeFactory db={this.props.db} typeDisplay="Focal Length" type="focalLength" field="focalLength" handleFilterChange={this.props.handleFilterChange} />
        );
    }
})

var FilterISORating = React.createClass({
	transformFromUIValue(value) {
		return Math.pow(2, value) * 100;
	},
	transformFromDBValue(value) {
		return Math.log((value / 100)) / Math.log(2)
	},
	render() {
        return (
            <FilterRangeFactory db={this.props.db} typeDisplay="ISO" type="iso" field="isoSpeedRating" handleFilterChange={this.props.handleFilterChange} transformFromDBValue={this.transformFromDBValue} transformFromUIValue={this.transformFromUIValue} />
        );
    }
})

var FilterAperture = React.createClass({
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
	            <FilterRangeFactory db={this.props.db} typeDisplay="Aperture" type="aperture" field="aperture" handleFilterChange={this.props.handleFilterChange} transformFromDBValue={this.transformFromDBValue} transformFromUIValue={this.transformFromUIValue} aditionalType={this.state.type} />	            
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