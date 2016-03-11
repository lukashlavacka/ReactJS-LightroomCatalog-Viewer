import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import squel from 'squel';
import q from 'q';
import _ from 'lodash';
import { LoadingWrapper } from './shared';
import * as Utilities from './utilities';

export default class PhotoStats extends React.Component {
    static propTypes = {
        popularStats: React.PropTypes.array.isRequired,
        filter: React.PropTypes.object,
    }

    static defaultProps = {
        popularStats: [
            { key: 'camera', field: 'camera.value', name: 'Camera Model' },
            { key: 'lens', field: 'lens.value', name: 'Lens' },
            { key: 'focalLength', field: 'exif.focalLength', name: 'Focal Length',
                transform: (val) => `${val}mm`,
            },
            { key: 'aperture', field: 'ROUND(exif.aperture, 2)', name: 'Aperture' },
            { key: 'iso', field: 'exif.isoSpeedRating', name: 'ISO' },
            { key: 'shutter', field: 'exif.shutterSpeed', name: 'Shutter Speed',
                transform: (val) => val > 0 ?
                    `1/${Math.round(100 / val)}s` :
                    `${1 / Math.round(100 / val)}s`,
            },
        ],
    }

    constructor(props) {
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
    }

    state = {
        loading: false,
        data: [],
    }

    componentDidMount() {
        this.getData(this.props)
        .then(this.transformData.bind(this, this.props))
        .then((data) => {
            this.setState({
                data,
                loading: false,
            });
        })
        .done();
    }

    componentWillReceiveProps(nextProps) {
        this.getData(nextProps)
        .then(this.transformData.bind(this, nextProps))
        .then((data) => {
            this.setState({
                data,
                loading: false,
            });
        })
        .done();
    }

    getData(properties) {
        this.setState({ loading: true });
        const queries = this.props.popularStats.map((s) => {
            let statQuery = squel
                .select()
                .field(s.field)
                .field('COUNT(images.id_local)')
                .from('Adobe_images', 'images')
                .where(`${s.field} IS NOT NULL`)
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
                statQuery = statQuery.where(Utilities.getFilterExpression(key, value));
            });
            return statQuery;
        });

        const query = queries.join(';');

        return properties.worker.exec(query);
    }

    transformData(properties, rawData) {
        const dataset = rawData || [];
        return q(dataset.map((d, i) => {
            const stat = this.props.popularStats[i];
            return {
                key: stat.key,
                name: stat.name,
                value: _.isFunction(stat.transform) ?
                    stat.transform(d.values[0][0]) :
                    d.values[0][0],
                count: d.values[0][1],
            };
        }));
    }

    render() {
        return (
            <LoadingWrapper loading={this.state.loading}>
                <table className="table">
                    <thead>
                        <tr>
                            {this.state.data.map((s) => <th key={s.key}>{s.name}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {this.state.data.map((s) =>
                                <td key={s.key}>{s.value} [{s.count} photo(s)]</td>
                            )}
                        </tr>
                    </tbody>
                </table>
            </LoadingWrapper>
        );
    }
}
