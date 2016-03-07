import React from 'react';
import squel from 'squel';
import Q from 'q';
import _ from 'lodash';
import {LoadingWrapper} from './shared';
import * as Utilities from './utilities';

export default class PhotoStats extends React.Component {
    static propTypes = {
        popularStats: React.PropTypes.array.isRequired,
        filter: React.PropTypes.object
    }
    static defaultProps = {
        popularStats: [
            {key: 'camera', field: 'camera.value', name: 'Camera Model'},
            {key: 'lens', field: 'lens.value', name: 'Lens'},
            {key: 'focalLength', field: 'exif.focalLength', name: 'Focal Length',
                transform(val) {
                    return val + 'mm';
                }
            },
            {key: 'aperture', field: 'ROUND(exif.aperture, 2)', name: 'Aperture'},
            {key: 'iso', field: 'exif.isoSpeedRating', name: 'ISO'},
            {key: 'shutter', field: 'exif.shutterSpeed', name: 'Shutter Speed',
                transform(val) {
                    let transformed;
                    if (val > 0) {
                        transformed = '1/' + Math.round(100 / val) + 's';
                    } else {
                        transformed = (1 / Math.round(100 / val)) + 's';
                    }
                    return transformed;
                }
            }
        ]
    }

    getData(properties) {
        this.setState({loading: true});
        const queries = this.props.popularStats.map((s) => {
            let statQuery = squel
                .select()
                .field(s.field)
                .field('COUNT(images.id_local)')
                .from('Adobe_images', 'images')
                .left_join('AgHarvestedExifMetadata', 'exif', 'images.id_local = exif.image')
                .left_join('AgLibraryKeywordImage', 'keyword', 'images.id_local = keyword.image')
                .left_join(
                    'AgInternedExifCameraModel',
                    'camera',
                    'exif.cameraModelRef = camera.id_local'
                )
                .left_join('AgInternedExifLens', 'lens', 'exif.lensRef = lens.id_local')
                .group(s.field)
                .order('COUNT(images.id_local)', false)
                .limit(1);

            _.forOwn(_.omitBy(properties.filter, _.isUndefined), (value, key) => {
                statQuery = statQuery.where(Utilities.GetFilterExpression(key, value));
            });
            return statQuery;
        });

        const query = queries.join(';');

        return properties.worker.exec(query);
    }

    transformData(properties, rawData) {
        const dataset = rawData || [];
        return Q(dataset.map((d, i) => {
            const stat = this.props.popularStats[i];
            return {
                key: stat.key,
                name: stat.name,
                value: _.isFunction(stat.transform) ?
                    stat.transform(d.values[0][0]) :
                    d.values[0][0],
                count: d.values[0][1]
            };
        }));
    }

    state = {
        loading: false,
        data: []
    }

    componentDidMount() {
        this.getData(this.props)
        .then(this.transformData.bind(this, this.props))
        .then((data) => {
            this.setState({
                data: data,
                loading: false
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

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(
            _.omitBy(this.props.filter, _.isUndefined),
            _.omitBy(nextProps.filter, _.isUndefined)
        ) || !_.isEqual(this.state, nextState);
    }

    render() {
        return (
            <LoadingWrapper loading={this.state.loading}>
                <table className="table">
                    <thead>
                        <tr>
                            {this.state.data.map((s) => {
                                return (<th key={s.key}>{s.name}</th>);
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {this.state.data.map((s) => {
                                return (<td key={s.key}>{s.value} [{s.count} photo(s)]</td>);
                            })}
                        </tr>
                    </tbody>
                </table>
            </LoadingWrapper>
        );
    }
}
