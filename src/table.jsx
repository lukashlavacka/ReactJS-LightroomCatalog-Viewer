import React from 'react';
import squel from 'squel';
import Q from 'q';
import _ from 'lodash';
import {LoadingWrapper, BootstrapRow} from './shared';
import * as Utilities from './utilities';
import WorkerWrapper from './worker-wrapper';

export default class TableViewer extends React.Component {
    static propTypes = {
        worker: React.PropTypes.instanceOf(WorkerWrapper).isRequired,
        filter: React.PropTypes.object
    }

    handleFieldChange(type, field) {
        switch (type) {
        default:
        case 'xField':
            this.setState({
                xField: field
            });
            break;
        case 'yField':
            this.setState({
                yField: field
            });
            break;
        }
    }

    state = {
        xField: 'exif.isoSpeedRating',
        yField: 'images.rating'
    }

    render() {
        let table;
        if (this.state.xField && this.state.yField) {
            table = (
                <Table worker={this.props.worker}
                    filter={this.props.filter}
                    xField={this.state.xField}
                    yField={this.state.yField} />
            );
        }
        return (
            <div>
                <FieldSelector
                    field={this.state.xField}
                    name="x agregate field"
                    otherField={this.state.yField}
                    handleFieldChange={this.handleFieldChange.bind(this, 'xField')} />
                <FieldSelector
                    field={this.state.yField}
                    name="y agregate field"
                    otherField={this.state.xField}
                    handleFieldChange={this.handleFieldChange.bind(this, 'yField')} />
                {table}
            </div>
        );
    }
}

class FieldSelector extends React.Component {
    static propTypes = {
        handleFieldChange: React.PropTypes.func.isRequired,
        agragateFields: React.PropTypes.array,
        field: React.PropTypes.string,
        otherField: React.PropTypes.string,
        name: React.PropTypes.string
    }

    static defaultProps = {
        agragateFields: [
            {field: 'camera.value', name: 'Camera'},
            {field: 'lens.value', name: 'Lens'},
            {field: 'exif.focalLength', name: 'Focal length'},
            {field: 'exif.isoSpeedRating', name: 'ISO'},
            {field: 'exif.aperture', name: 'Aperture'},
            {field: 'exif.shutterSpeed', name: 'Shutter Speed'},
            {field: 'images.pick', name: 'Flag'},
            {field: 'images.colorLabels', name: 'Color label'},
            {field: 'images.rating', name: 'Rating'},
            {field: 'keyword.tag', name: 'Face'},
            {field: 'strftime("%Y", images.captureTime)', name: 'Year'},
            {field: 'strftime("%Y-%m", images.captureTime)', name: 'Month'},
            {field: 'strftime("%Y-%W", images.captureTime)', name: 'Week'},
            {field: 'strftime("%Y-%m-%d", images.captureTime)', name: 'Day'}
        ]
    }

    handleChange(event) {
        this.props.handleFieldChange(event.target.value);
    }

    render() {
        const otherFields = _.reject(this.props.agragateFields, {field: this.props.otherField});
        return (
            <BootstrapRow>
                <div>
                    <h3>Select {this.props.name}</h3>
                    {otherFields.map((f) => {
                        return (
                                <label
                                    key={f.field}
                                    className="radio-inline">
                                    <input
                                        type="radio"
                                        checked={this.props.field === f.field}
                                        value={f.field}
                                        onChange={this.handleChange} />
                                        {f.name}
                                </label>
                        );
                    })}
                </div>
            </BootstrapRow>
        );
    }
}

class Table extends React.Component {
    static propTypes = {
        xField: React.PropTypes.string,
        yField: React.PropTypes.string
    }

    state = {
        loading: false
    }

    getData(properties) {
        this.setState({loading: true});

        let s = squel
            .select()
            .field(properties.xField)
            .field(properties.yField)
            .field('COUNT(images.id_local)')
            .field('AVG(IFNULL(images.rating, 0))')
            .from('Adobe_images', 'images')
            .left_join('AgHarvestedExifMetadata', 'exif', 'images.id_local = exif.image')
            .left_join('AgLibraryKeywordImage', 'keyword', 'images.id_local = keyword.image')
            .left_join(
                'AgInternedExifCameraModel',
                'camera',
                'exif.cameraModelRef = camera.id_local'
            )
            .left_join('AgInternedExifLens', 'lens', 'exif.lensRef = lens.id_local')
            .where(properties.xField + ' IS NOT NULL')
            .where(properties.yField + ' IS NOT NULL');


        _.forOwn(_.omitBy(properties.filter, _.isUndefined), (value, key) => {
            s = s.where(Utilities.GetFilterExpression(key, value));
        });

        s = s
            .order(properties.xField)
            .order(properties.yField)
            .group(properties.xField)
            .group(properties.yField);

        const query = s.toString();

        return properties.worker.exec(query);
    }

    transformData(properties, rawData) {
        const dataset = rawData && rawData[0] && rawData[0].values || [];
        return Q(dataset);
    }

    componentDidMount() {
        this.getData(this.props)
        .then(this.transformData.bind(this, this.props))
        .then((data) => {
            this.setState({
                loading: false,
                data: data
            });
        });
    }

    componentWillReceiveProps(nextProps) {
        this.getData(nextProps)
        .then(this.transformData.bind(this, nextProps))
        .then((data) => {
            this.setState({
                data: data,
                loading: false
            });
        });
    }

    render() {
        return (
            <LoadingWrapper loading={this.state.loading}>
                <TableComponent
                    data={this.state.data}
                    xField={this.props.xField}
                    yField={this.props.yField}/>
            </LoadingWrapper>
        );
    }
}

class TableComponent extends React.Component {
    static propTypes = {
        data: React.PropTypes.array,
        xField: React.PropTypes.string,
        yField: React.PropTypes.string
    }
    transformData() {
        const uniqueX = _(this.props.data)
            .map((r) => {
                return r[0];
            })
            .uniq()
            .value()
            .sort(this.correctSort(this.props.xField));

        const uniqueY = _(this.props.data)
            .map((r) => {
                return r[1];
            })
            .uniq()
            .value()
            .sort(this.correctSort(this.props.yField));

        const maxCount = _(this.props.data)
            .map((r) => {
                return r[2];
            })
            .max();

        const maxAverage = _(this.props.data)
            .map((r) => {
                return r[3];
            })
            .max();

        return {
            uniqueX: uniqueX,
            uniqueY: uniqueY,
            maxCount: maxCount,
            maxAverage: maxAverage
        };
    }

    correctSort(field) {
        switch (field) {
        case 'numeric':
        case 'exif.focalLength':
        case 'exif.isoSpeedRating':
        case 'exif.aperture':
        case 'images.rating':
        default:
            return ((a, b) => {
                return a - b;
            });
        }
    }

    findByXY(xVal, yVal, maxCount, maxAverage) {
        const row = _.find(this.props.data, (r) => {
            return r[0] === xVal && r[1] === yVal;
        });

        const count = row && row[2] ? row[2] : 0;
        const avergeRating = row && row[3] ? row[3] : 0;

        return {
            count: count,
            rating: avergeRating,
            relCount: count / maxCount,
            relRating: avergeRating / maxAverage
        };
    }

    render() {
        if (!this.props.data) {
            return null;
        }
        const transformedData = this.transformData();
        return (
            <div className="table-responsive">
                <table className="table table-condensed table-col-hover table-bordered">
                    <thead>
                        <tr>
                            <th></th>
                            {transformedData.uniqueX.map((xVal) => {
                                return (<th key={xVal}>{xVal}</th>);
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {transformedData.uniqueY.map((yVal) => {
                            return (<tr key={yVal}>
                                <th>{yVal}</th>
                                {transformedData.uniqueX.map((xVal) => {
                                    const val = this.findByXY(
                                        xVal,
                                        yVal,
                                        transformedData.maxCount,
                                        transformedData.maxAverage
                                    );
                                    const style = {
                                        backgroundColor:
                                            'hsla(0, 0%, ' +
                                            Math.round(val.relCount * 100) +
                                            '%, 0.05)'
                                    };
                                    return (
                                        <td
                                            key={yVal + '_' + xVal}
                                            style={style}
                                            title={val.rating}>
                                            {val.count}
                                        </td>
                                    );
                                })}
                            </tr>);
                        })}
                    </tbody>
                </table>
            </div>
        );
    }
}
