import React from 'react';
import ScriptjsLoader from "react-google-maps/lib/async/ScriptjsLoader";
import {GoogleMap, Marker} from 'react-google-maps';
import MarkerClusterer from 'react-google-maps/lib/addons/MarkerClusterer';
import {triggerEvent} from 'react-google-maps/lib/utils';
import squel from 'squel';
import Q from 'q';
import {LoadingWrapper} from './shared';
import * as Utilities from './utilities';
import WorkerWrapper from './worker-wrapper';


export default class MapViewer extends React.Component {
    static version = Math.ceil(Math.random() * 22);

    static propTypes = {
        worker: React.PropTypes.instanceOf(WorkerWrapper).isRequired,
        filter: React.PropTypes.object
    }

    getData(properties) {
        this.setState({loading: true});
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
            s = s.where(Utilities.GetFilterExpression(key, value));
        });

        const query = s.toString();

        return properties.worker.exec(query);
    }

    transformData(properties, rawData) {
        const dataset = rawData && rawData[0] && rawData[0].values || [];
        return Q(dataset.map((d) => {
            return {
                id: d[0],
                lat: d[1],
                lng: d[2]
            };
        }));
    }

    state = {
        loading: false,
        data: []
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleUpdateDimensions);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleUpdateDimensions);
    }

    handleUpdateDimensions = () => {
        if(this._googleMapComponent){
            triggerEvent(this._googleMapComponent, "resize")
        }
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

    render() {
        return (
            <LoadingWrapper loading={this.state.loading}>
                <ScriptjsLoader
                    hostname={"maps.googleapis.com"}
                    pathname={"/maps/api/js"}
                    query={{v: `3.${MapViewer.version}`, libraries: "geometry, drawing, places"}}
                    loadingElement={
                        <LoadingWrapper loading={true} />
                    }
                    containerElement={
                        <div {...this.props} style={{ height: "100%" }} />
                    }
                    googleMapElement={
                        <GoogleMap
                            ref={it => this._googleMapComponent = it}
                            defaultZoom={1}
                            defaultCenter={{lat: 0, lng: 0}}
                        >
                            <MarkerClusterer
                                averageCenter
                                enableRetinaIcons
                                gridSize={ 60 }
                            >
                                {this.state.data.map(d => (
                                    <Marker
                                    key={d.id}
                                    position={d}/>
                                ))}
                            </MarkerClusterer>
                        </GoogleMap>
                    }
                />
            </LoadingWrapper>
        );
    }
}