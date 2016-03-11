import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import ScriptjsLoader from 'react-google-maps/lib/async/ScriptjsLoader';
import { GoogleMap, Marker, OverlayView } from 'react-google-maps';
import MarkerClusterer from 'react-google-maps/lib/addons/MarkerClusterer';
import { triggerEvent } from 'react-google-maps/lib/utils';
import squel from 'squel';
import q from 'q';
import _ from 'lodash';
import { LoadingWrapper } from './shared';
import * as Utilities from './utilities';
import WorkerWrapper from './worker-wrapper';


export default class MapViewer extends React.Component {
    static version = Math.ceil(Math.random() * 22);

    static propTypes = {
        worker: React.PropTypes.instanceOf(WorkerWrapper).isRequired,
        filter: React.PropTypes.object,
        types: React.PropTypes.array.isRequired,
        handleFilterChange: React.PropTypes.func.isRequired,
    }

    static defaultProps = {
        types: [
            { key: '1', name: 'Zoom to cluster' },
            { key: '2', name: 'Filter to cluster' },
        ],
    }

    constructor(props) {
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
    }

    state = {
        loading: false,
        data: [],
        type: '2',
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleUpdateDimensions);

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

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleUpdateDimensions);
    }

    onMarkerClick = (markerCluster) => {
        if (this.state.type === '2') {
            const imageIDs = markerCluster.markers_.map(m => parseInt(m.title, 10));
            this.props.handleFilterChange('map', imageIDs);
            this.setState({ filterBounds: markerCluster.bounds_ });
        }
    }

    onClearFilter = () => {
        this.props.handleFilterChange('map');
        this.setState({ filterBounds: undefined });
    }

    getData(properties) {
        this.setState({ loading: true });
        let s = squel
            .select()
            .field('images.id_local')
            .field('exif.gpsLatitude')
            .field('exif.gpsLongitude')
            .from('Adobe_images', 'images')
            .left_join('AgHarvestedExifMetadata', 'exif', 'images.id_local = exif.image')
            .left_join('AgLibraryKeywordImage', 'keyword', 'images.id_local = keyword.image')
            .left_join(
                'AgInternedExifCameraModel',
                'camera',
                'exif.cameraModelRef = camera.id_local'
            )
            .left_join('AgInternedExifLens', 'lens', 'exif.lensRef = lens.id_local')
            .where('exif.hasGPS = 1');

        _.forOwn(_.omitBy(properties.filter, _.isUndefined), (value, key) => {
            s = s.where(Utilities.getFilterExpression(key, value));
        });

        const query = s.toString();

        return properties.worker.exec(query);
    }

    transformData(properties, rawData) {
        const dataset = rawData && rawData[0] && rawData[0].values || [];
        return q(dataset.map((d) => ({
            id: d[0],
            lat: d[1],
            lng: d[2],
        })));
    }

    handleChange = (event) => {
        this.setState({
            type: event.target.value,
        });
    }

    handleUpdateDimensions = () => {
        if (this.googleMapComponent) {
            triggerEvent(this.googleMapComponent, 'resize');
        }
    }

    render() {
        window.console.log('Map rendered: ');
        let overlayView;
        if (this.state.filterBounds) {
            overlayView = (
                <OverlayView
                    bounds={this.state.filterBounds}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                    <div
                        style={{
                            background: 'rgba(50,50,50,0.1)',
                            width: '100%',
                            height: '100%',
                        }}
                        id="overlay"
                    >
                        <button
                            style={{ position: 'absolute', top: '0', right: '0' }}
                            type="button"
                            onClick={this.onClearFilter}
                        >
                            x
                        </button>
                    </div>
                </OverlayView>
            );
        }
        return (
            <LoadingWrapper loading={this.state.loading}>
                {this.props.types.map((type) =>
                    <div key={type.key} className="radio-inline">
                        <label>
                            <input
                                type="radio"
                                checked={this.state.type === type.key}
                                value={type.key}
                                onChange={this.handleChange}
                            />
                            {type.name}
                        </label>
                    </div>
                )}
                <ScriptjsLoader
                    hostname={"maps.googleapis.com"}
                    pathname={"/maps/api/js"}
                    query={{ v: `3.${MapViewer.version}`, libraries: 'geometry, drawing, places' }}
                    loadingElement={
                        <LoadingWrapper loading />
                    }
                    containerElement={
                        <div {...this.props} style={{ height: '100%' }} />
                    }
                    googleMapElement={
                        <GoogleMap
                            ref={it => { this.googleMapComponent = it; }}
                            containerProps={{ ...this.props, style: { height: '100%' } }}
                            defaultZoom={1}
                            defaultCenter={{ lat: 0, lng: 0 }}
                        >
                            {overlayView}
                            <MarkerClusterer
                                averageCenter
                                enableRetinaIcons
                                gridSize={ 60 }
                                onClick={this.onMarkerClick}
                                zoomOnClick={!this.state.filterBounds}
                            >
                                {this.state.data.map(d => (
                                    <Marker
                                        key={d.id}
                                        clickable={false}
                                        optimized
                                        title={`${d.id}`}
                                        position={d}
                                    />
                                ))}
                            </MarkerClusterer>
                        </GoogleMap>
                    }
                />
            </LoadingWrapper>
        );
    }
}
