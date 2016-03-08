import React from 'react';
import CheckboxGroup from 'react-checkbox-group';
import DatePicker from 'react-datepicker';
import ReactSlider from 'react-slider';
import moment from 'moment';
import squel from 'squel';
import Q from 'q';
import _ from 'lodash';
import {LoadingWrapper} from './shared';
import WorkerWrapper from './worker-wrapper';

class FilterFactory extends React.Component {
    constructor(props) {
        super(props);

        if (this.props.options) {
            this.state.options = this.props.options;
        }
    }

    static propTypes = {
        handleFilterChange: React.PropTypes.func,
        transformName: React.PropTypes.func,
        worker: React.PropTypes.instanceOf(WorkerWrapper).isRequired,
        type: React.PropTypes.string,
        table: React.PropTypes.string,
        options: React.PropTypes.array,
        valueProp: React.PropTypes.string,
        nameProp: React.PropTypes.string,
        dataFilter: React.PropTypes.string
    }

    getData(properties) {
        this.setState({loading: true});
        let s = squel
            .select()
            .field(properties.valueProp || 'id_local', 'value')
            .field(properties.nameProp || 'value', 'name')
            .from(properties.table);

        if (properties.dataFilter) {
            s = s.where(properties.dataFilter);
        }

        const query = s.toString();

        return properties.worker.exec(query);
    }

    transformData = (properties, rawData) => {
        const dataset = rawData && rawData[0] || {values: []};
        return Q(dataset.values.map((t) => {
            return {
                value: t[0], name: t[1]
            };
        }));
    }

    handleChange = () => {
        this.props.handleFilterChange(
            this.props.type,
            this.refs[this.props.type].getCheckedValues()
        );
    }

    transformName(name) {
        if (_.isFunction(this.props.transformName)) {
            return this.props.transformName(name);
        }
        return name;
    }

    state = {
        loading: false,
        options: []
    }

    componentDidMount() {
        if (this.props.table) {
            this.getData(this.props)
            .then(this.transformData.bind(this, this.props))
            .then((data) => {
                this.setState({
                    options: data,
                    loading: false
                });
            });
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.table) {
            this.getData(nextProps)
            .then(this.transformData.bind(this, nextProps))
            .then((data) => {
                this.setState({
                    options: data,
                    loading: false
                });
            });
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.state.options, nextState.options) ||
                this.props.valueProp !== nextProps.valueProp ||
                this.props.nameProp !== nextProps.nameProp ||
                this.props.table !== nextProps.table ||
                this.props.dataFilter !== nextProps.dataFilter;
    }

    render() {
        return (
            <LoadingWrapper loading={this.state.loading}>
                <form>
                    <CheckboxGroup
                        name={this.props.type}
                        ref={this.props.type}
                        onChange={this.handleChange} >
                            {this.state.options.map((o) => {
                                return (<label
                                    key={o.value}
                                    className="checkbox-inline">
                                        <input
                                            type="checkbox"
                                            value={o.value} />
                                        {this.transformName(o.name)}
                                    </label>);
                            })}
                    </CheckboxGroup>
                </form>
            </LoadingWrapper>
        );
    }
}

class FilterRangeFactory extends React.Component {
    constructor(props) {
        super(props);

        if(props.minMax) {
            this.state = {
                dbMin: props.minMax.min,
                dbMax: props.minMax.max,
                dbMinVal: props.minMax.min,
                dbMaxVal: props.minMax.max,
                uiMin: props.invert ?
                    this.transformFromDBValue(props.minMax.max) :
                    this.transformFromDBValue(props.minMax.min, true),
                uiMax: props.invert ?
                    this.transformFromDBValue(props.minMax.min, true) :
                    this.transformFromDBValue(props.minMax.max)
            }
        }
    }

    static propTypes = {
        field: React.PropTypes.string,
        type: React.PropTypes.string,
        handleFilterChange: React.PropTypes.func,
        transformFromDBValue: React.PropTypes.func,
        transformToUIName: React.PropTypes.func,
        transformFromUIValue: React.PropTypes.func,
        invert: React.PropTypes.bool,
        minMax: React.PropTypes.object,
        aditionalType: React.PropTypes.string
    }

    state = {
        loading: false
    }

    getData = (properties) => {
        this.setState({loading: true});
        const s = squel
            .select()
            .field(`MIN(${properties.field})`)
            .field(`MAX(${properties.field})`)
            .from('AgHarvestedExifMetadata')
            .where(properties.field + ' > 0');
        const query = s.toString();

        return properties.worker.exec(query);
    }

    transformData = (properties, rawData) => {
        const values = rawData
            && rawData[0]
            && rawData[0].values
            && rawData[0].values[0];

        let minMax = {};
        if (values) {
            minMax = {
                min: values[0],
                max: values[1]
            };
        }
        return Q(minMax);
    }

    handleChange = (value) => {
        const dbVal = value.map(this.transformFromUIValue);
        this.setState({
            dbMinVal: dbVal[0],
            dbMaxVal: dbVal[1],
            uiMin: value[0],
            uiMax: value[1]
        });
        this.props.handleFilterChange(this.props.type, dbVal);
    }

    transformFromDBValue = (value, isMin) => {
        if (_.isFunction(this.props.transformFromDBValue)) {
            return this.props.transformFromDBValue(value, isMin);
        }
        return value;
    }

    transformFromUIValue = (value) => {
        if (_.isFunction(this.props.transformFromUIValue)) {
            return this.props.transformFromUIValue(value);
        }
        return value;
    }

    transformToUIName = (value) => {
        if (_.isFunction(this.props.transformToUIName)) {
            return this.props.transformToUIName(value);
        }
        if (_.isFunction(this.props.transformFromUIValue)) {
            return this.props.transformFromUIValue(value);
        }
        return value;
    }

    componentDidMount() {
        if (this.props.field) {
            this.getData(this.props)
                .then(this.transformData.bind(this, this.props))
                .then((data) => {
                    const minMax = data;
                    this.setState({
                        loading: false,
                        dbMin: minMax.min,
                        dbMax: minMax.max,
                        dbMinVal: minMax.min,
                        dbMaxVal: minMax.max,
                        uiMin: this.props.invert ?
                            this.transformFromDBValue(minMax.max) :
                            this.transformFromDBValue(minMax.min, true),
                        uiMax: this.props.invert ?
                            this.transformFromDBValue(minMax.min, true) :
                            this.transformFromDBValue(minMax.max)
                    });
                });
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.state.dbMin !== nextState.dbMin
            || this.state.dbMax !== nextState.dbMax
            || this.state.uiMin !== nextState.uiMin
            || this.state.uiMax !== nextState.uiMax
            || this.props.aditionalType !== nextProps.aditionalType;
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.aditionalType !== nextProps.aditionalType) {
            const uiMin = this.transformFromDBValue(
                Math.max(this.state.dbMinVal, this.state.dbMin), true
            );
            const uiMax = this.transformFromDBValue(
                Math.min(this.state.dbMaxVal, this.state.dbMax)
            );

            const uiDbMin = this.transformFromUIValue(uiMin);
            const uiDbMax = this.transformFromUIValue(uiMax);

            this.setState({
                uiMin: uiMin,
                uiMax: uiMax,
                dbMinVal: uiDbMin,
                dbMaxVal: uiDbMax
            });
            this.props.handleFilterChange(nextProps.type, [uiDbMin, uiDbMax]);
        }
    }

    render() {
        if (typeof this.state.dbMin === 'undefined' || this.state.loading) {
            return <LoadingWrapper loading={true} />;
        }
        if (typeof this.state.dbMin === 'undefined') {
            return null;
        }
        if (this.state.dbMin === this.state.dbMax) {
            return (
                <span>Only one value available {this.state.dbMin}</span>
            );
        }
        return (
            <LoadingWrapper loading={this.state.loading}>
                <ReactSlider
                    value={[this.state.uiMin, this.state.uiMax]}
                    min={this.props.invert ?
                        this.transformFromDBValue(this.state.dbMax) :
                        this.transformFromDBValue(this.state.dbMin, true)}
                    max={this.props.invert ?
                        this.transformFromDBValue(this.state.dbMin, true) :
                        this.transformFromDBValue(this.state.dbMax)}
                    onChange={this.handleChange}
                    pearling={true}
                    invert={this.props.invert}
                    withBars
                >
                    <div>{this.transformToUIName(this.state.uiMin)}</div>
                    <div>{this.transformToUIName(this.state.uiMax)}</div>
                </ReactSlider>
            </LoadingWrapper>
        );
    }
}

export class FilterCamera extends React.Component {
    render() {
        return (
            <FilterFactory type="camera" table="AgInternedExifCameraModel" {...this.props} />
        );
    }
}

export class FilterLens extends React.Component {
    transformName = (name) => {
        if (name === 'DT 0mm F0 SAM') {
            return 'Unknown';
        }
        return name;
    }

    render() {
        return (
            <FilterFactory
                type="lens"
                table="AgInternedExifLens"
                transformName={this.transformName}
                {...this.props} />
        );
    }
}

export class FilterFocalLength extends React.Component {
    render() {
        return (
            <FilterRangeFactory type="focalLength" field="focalLength" {...this.props} />
        );
    }
}

export class FilterISORating extends React.Component {
    transformFromUIValue = (value) => {
        return Math.pow(2, value) * 100;
    }

    transformFromDBValue = (value) => {
        return Math.log((value / 100)) / Math.log(2);
    }

    render() {
        return (
            <FilterRangeFactory
                type="iso"
                field="isoSpeedRating"
                transformFromDBValue={this.transformFromDBValue}
                transformFromUIValue={this.transformFromUIValue}
                {...this.props} />
        );
    }
}

export class FilterAperture extends React.Component {
    static propTypes = {
        types: React.PropTypes.object
    }

    transformFromUIValue = (value) => {
        if (this.state.type === 'Continuous') {
            return value / 10;
        }

        return this.types[this.state.type][value];
    }

    transformFromDBValue = (value, isFirst) => {
        if (this.state.type === 'Continuous') {
            return isFirst ? Math.floor(value * 10) : Math.ceil(value * 10);
        }

        return _.findIndex(this.types[this.state.type], (v) => {
            return value < v;
        }) - (isFirst ? 1 : 0);
    }

    handleChange = (event) => {
        this.setState({
            type: event.target.value
        });
    }

    static defaultProps = {
        types: {
            Full: [0.5, 0.7, 1.0, 1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32],
            Half: [
                0.7, 0.8, 1.0, 1.2, 1.4, 1.7, 2, 2.4, 2.8, 3.3,
                4, 4.8, 5.6, 6.7, 8, 9.5, 11, 13, 16, 19, 22, 27, 32
            ],
            Third: [
                0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.4, 1.6, 1.8, 2, 2.2,
                2.5, 2.8, 3.2, 3.5, 4, 4.5, 5.0, 5.6, 6.3, 7.1,
                8, 9, 10, 11, 13, 14, 16, 18, 20, 22, 25, 29, 32
            ],
            Continuous: []
        }
    }

    state = {
        type: 'Continuous'
    }

    render() {
        return (
            <div>
                <FilterRangeFactory
                    type="aperture"
                    field="aperture"
                    transformFromDBValue={this.transformFromDBValue}
                    transformFromUIValue={this.transformFromUIValue}
                    aditionalType={this.state.type}
                    {...this.props}/>
                {_.keys(this.props.types).map((key) => {
                    return (
                        <div key={key} className="radio-inline">
                            <label><input
                                type="radio"
                                checked={this.state.type === key}
                                value={key}
                                onChange={this.handleChange} />{key}
                            </label>
                        </div>
                    );
                })}
            </div>
        );
    }
}

export class FilterShutter extends React.Component {
    transformFromUIValue = (value) => {
        return 100 / value;
    }

    transformFromDBValue = (value) => {
        return Math.round(100 / value);
    }

    transformToUIName = (value) => {
        let transformed;
        if (value > 0) {
            transformed = `1/${Math.round(value)}`;
        } else {
            transformed = `${1/value}s`;
        }

        return transformed;
    }

    render() {
        return (
            <FilterRangeFactory
                type="shutter"
                field="shutterSpeed"
                invert={true}
                transformFromDBValue={this.transformFromDBValue}
                transformFromUIValue={this.transformFromUIValue}
                transformToUIName={this.transformToUIName}
                {...this.props} />
        );
    }
}

export class FilterFlag extends React.Component {
    static propTypes = {
        options: React.PropTypes.array
    }

    static defaultProps = {
        options: [
            { value: 0, name: "None"},
            { value: -1, name: "Rejected"},
            { value: 1, name: "Selected"}
        ]
    }

    render() {
        return (
            <FilterFactory type="flag" {...this.props}/>
        );
    }
}

export class FilterColor extends React.Component {
    static propTypes = {
        options: React.PropTypes.array
    }

    static defaultProps = {
        options: [
            {value: '', name: 'None'},
            {value: 'Red', name: 'Red'},
            {value: 'Yellow', name: 'Yellow'},
            {value: 'Green', name: 'Green'},
            {value: 'Blue', name: 'Blue'},
            {value: 'Purple', name: 'Purple'}
        ]
    }

    render() {
        return (
            <FilterFactory type="color" {...this.props}/>
        );
    }
}

export class FilterRating extends React.Component {
    static propTypes = {
        options: React.PropTypes.array,
        minMax: React.PropTypes.object
    }

    static defaultProps = {
        options: [
            {value: 0, name: 'unrated'},
            {value: 1, name: '1 star'},
            {value: 2, name: '2 star'},
            {value: 3, name: '3 star'},
            {value: 4, name: '4 star'},
            {value: 5, name: '5 star'}
        ],
        minMax: {
            min: 0,
            max: 5
        }
    }

    transformToUIName = (value) => {
        return _.find(this.props.options, {value: value}).name;
    }

    render() {
        return (
            <FilterRangeFactory
                type="rating"
                transformToUIName={this.transformToUIName}
                {...this.props}/>
        );
    }
}

export class FilterFace extends React.Component {
    render() {
        return (
            <FilterFactory
                type="face"
                table="AgLibraryKeyword"
                dataFilter="keywordType = 'person'"
                nameProp="Name"
                {...this.props} />
        );
    }
}

export class FilterDate extends React.Component {
    static propTypes = {
        handleFilterChange: React.PropTypes.func.isRequired
    }

    getData(properties) {
        this.setState({loading: true});
        const s = squel
            .select()
            .field('MIN(captureTime)')
            .field('MAX(captureTime)')
            .from('Adobe_images');

        const query = s.toString();
        return properties.worker.exec(query);
    }

    transformData = (properties, rawData) => {
        const values = rawData
            && rawData[0]
            && rawData[0].values
            && rawData[0].values[0];

        let minMax = {};
        if (values) {
            minMax = {
                min: values[0],
                max: values[1]
            };
        }
        return Q(minMax);
    }

    handleChange = (otherDate, isStart, thisDate) => {
        if (isStart) {
            this.setState({startDate: thisDate});
        } else {
            this.setState({endDate: thisDate});
        }

        this.props.handleFilterChange('date', isStart ?
            [thisDate, otherDate] : [otherDate, thisDate]);
    }

    state = {
        loading: false,
        min: moment().subtract(1, 'month'),
        max: moment().add(1, 'month'),
        startDate: moment().subtract(1, 'month'),
        endDate: moment().add(1, 'month')
    }

    componentDidMount() {
        this.getData(this.props)
            .then(this.transformData.bind(this, this.props))
            .then((data) => {
                this.setState({
                    loading: false,
                    min: moment(data.min),
                    max: moment(data.max),
                    startDate: moment(data.min),
                    endDate: moment(data.max)
                });
            });
    }

    render() {
        const style = {
            width: '50%',
            float: 'left'
        };

        return (
            <LoadingWrapper loading={this.state.loading}>
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
          </LoadingWrapper>
        );
    }
}
