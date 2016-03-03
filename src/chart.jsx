import React from 'react'
import {Bar as BarChart, Pie as PieChart} from "react-chartjs"
import squel from "squel"
import Q from 'q'
import _ from 'lodash'
import { LoadingWrapper } from './shared'
import { GetFilterExpression } from './utilities'

export default class ChartViewer extends React.Component {
    static defaultProps = {    
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
        ] 
    }

    handleFieldChange(fieldName) {
        this.setState({
            field : _.find(this.props.agragateFields, {field: fieldName })
        })
    }

    state = {
        field : _.find(this.props.agragateFields, {field: "camera.value" })
    }

    render() {
        if(this.state.field)
            var chart = <Chart worker={this.props.worker} filter={this.props.filter} field={this.state.field} />
        return (
            <div>
                <FieldSelector agragateFields={this.props.agragateFields} field={this.state.field} handleFieldChange={this.handleFieldChange} />
                {chart}
            </div>
        )
    }
}

class FieldSelector extends React.Component{
	handleChange(event) {
		this.props.handleFieldChange(event.target.value)
	}

	render() {
		return (
			<div>
                <h3>Select agregate field</h3>
	            {this.props.agragateFields.map((f) => {
	                return (
	                        <label key={f.field} className="radio-inline"><input type="radio" checked={this.props.field.field === f.field} value={f.field} onChange={this.handleChange} />{f.name}</label>
	                )
	            })}
            </div>
		);
	}
}

class Chart extends React.Component{
    getData(properties) {
        this.setState({loading: true})
        var s = squel
            .select()
            .field(properties.field.field)
            .field("COUNT('images.id_local')")
            .from("Adobe_images", "images")
            .left_join("AgHarvestedExifMetadata", "exif", "images.id_local = exif.image")
            .left_join("AgLibraryKeywordImage", "keyword", "images.id_local = keyword.image")
            .left_join("AgInternedExifCameraModel", "camera", "exif.cameraModelRef = camera.id_local")
            .left_join("AgInternedExifLens", "lens", "exif.lensRef = lens.id_local");


        _.forOwn(_.omitBy(properties.filter, _.isUndefined), (value, key) => {
        	s.where(GetFilterExpression(key, value))
        })

        s = s
            .order(properties.field.field)
        	.group(properties.field.field)

        var query = s.toString();

        return properties.worker.exec(query)
    }

    state = {
        data: {columns: [], values: []}
    };

    transformData(properties, rawData) {
        return Q(rawData[0] || {columns: [], values: []});
    }

    componentDidMount() {        
        this.getData(this.props)
        .then(this.transformData.bind(this, this.props))
        .then((data) => {
            this.setState({
                data : data,
                loading: false
            })
        })
    }

    componentWillReceiveProps(nextProps) {
        var noRedraw = this.props.field.field === nextProps.field.field;
        this.getData(nextProps)
        .then(this.transformData.bind(this, nextProps))
        .then((data) => {
            var oldValues = this.state.data.values.map((v) => {return v[0]});
            var newValues = data.values.map((v) => {return v[0]});
            this.setState({
                data : data,
                loading: false,
                noRedraw: noRedraw && _.isEqual(oldValues, newValues)
            })
        })
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState);
    }

	render() {
        var chartElement;
        switch(this.props.field.type) {
            case "pie":
                chartElement = <PieChartComponent rawData={this.state.data} noRedraw={this.state.noRedraw} />
                break;
            case "bar":
                chartElement = <BarChartComponent rawData={this.state.data} noRedraw={this.state.noRedraw} />
                break;
        }
		return (
            <LoadingWrapper loading={this.state.loading}>
                {chartElement}
            </LoadingWrapper>
        )
	}
}

class BarChartComponent extends React.Component {
    static defaultProps = {
        options : {
            responsive: true,
            animationEasing : "easeInOutCubic",
            animationSteps: 30
        }
    }

    expandDataset(rawData) {
        var data = {
            labels: rawData.values.map((v) => {return v[0] || "Undefined"}),
            datasets: []
        }

        data.datasets.push({
            label: "Count",
            data: rawData.values.map((v) => {return v[1] || "Undefined"})
        })

        data.dataset = data.datasets.map((d, i) =>  {
            var hue = i * (360 / data.datasets.length)

            d.fillColor       = "hsla(" + hue + ",90%,50%,0.5)";
            d.strokeColor     = "hsla(" + hue + ",90%,50%,0.8)";
            d.highlightFill   = "hsla(" + hue + ",90%,50%,0.75)";
            d.highlightStroke = "hsla(" + hue + ",90%,50%,1.0)";
            return d;
        })
        return data;
    }

    render() {
        var data = this.expandDataset(this.props.rawData)

        var chart
        if(this.props.noRedraw)
            chart = <BarChart data={data} options={this.props.options} ref="pieChart" />
        else
            chart = <BarChart data={data} options={this.props.options} ref="pieChart" redraw />

        return chart;
    }
}

class PieChartComponent extends React.Component {
    static defaultProps = {
        options : {
            responsive: true,
            animationEasing : "easeInOutCubic",
            animationSteps: 30
        }
    }

    expandDataset(rawData) {
        var data = _.sortBy(rawData.values, 'v[0]').map((v, i) => {
            var hue = i * (360 / rawData.values.length)

            return {
                label: v[0] || "Undefined",
                value: v[1],
                color: "hsl(" + hue + ",80%,50%)",
                highlight: "hsl(" + hue + ",90%,60%)"
            }
        })

        return data;
    }

    state = {
        legendHTML: ""
    }

    componentDidMount() {
        this.setState({legendHTML : this.refs.pieChart.generateLegend()})
    }

    componentDidUpdate(prevProps, prevState) {
        if(!_.isEqual(prevProps.rawData, this.props.rawData))
            this.setState({legendHTML : this.refs.pieChart.generateLegend()})
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState);
    }

    render() {
        var data = this.expandDataset(this.props.rawData)

        var chart
        if(this.props.noRedraw)
            chart = <PieChart data={data} options={this.props.options} ref="pieChart" />
        else
            chart = <PieChart data={data} options={this.props.options} ref="pieChart" redraw />

        return (
            <div>
                {chart}
                <div className="chart-legend" dangerouslySetInnerHTML={{ __html: this.state.legendHTML }} />
            </div>
        )
    }
}