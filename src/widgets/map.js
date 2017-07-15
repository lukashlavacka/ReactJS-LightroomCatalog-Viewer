import React from "react";
import PropTypes from "prop-types";
import {
  withGoogleMap,
  GoogleMap,
  Marker,
  OverlayView
} from "react-google-maps";
import withScriptjs from "react-google-maps/lib/async/withScriptjs";
import MarkerClusterer from "react-google-maps/lib/addons/MarkerClusterer";
import _ from "lodash";
import * as Utilities from "../common/utilities";
import DataWidget from "../common/dataWidget";
import { Radio } from "../common/shared";

const GoogleMapInstance = withScriptjs(
  withGoogleMap(props =>
    <GoogleMap
      ref={props.onMapLoad}
      defaultZoom={1}
      defaultCenter={{ lat: 0, lng: 0 }}
    >
      {props.overlayView}
      <MarkerClusterer
        averageCenter
        enableRetinaIcons
        gridSize={60}
        onClick={props.onMarkerClick}
        zoomOnClick={props.zoomOnClick}
      >
        {props.data.map(d =>
          <Marker
            key={d.id}
            clickable={false}
            optimized
            title={`${d.id}`}
            position={d}
          />
        )}
      </MarkerClusterer>
    </GoogleMap>
  )
);

export default class MapViewer extends DataWidget {
  static version = Math.ceil(Math.random() * 22);

  static propTypes = {
    ...DataWidget.propTypes,
    types: PropTypes.array.isRequired,
    handleFilterChange: PropTypes.func.isRequired
  };

  static defaultProps = {
    ...DataWidget.defaultProps,
    types: [
      { key: "1", field: "zoom", name: "Zoom to cluster" },
      { key: "2", field: "filter", name: "Filter to cluster" }
    ]
  };

  constructor(props) {
    super(props);
    this.state = Object.assign(this.state, { type: "filter" });
  }

  handleMarkerClick = markerCluster => {
    if (this.state.type === "filter") {
      const imageIDs = markerCluster.markers_.map(m => parseInt(m.title, 10));
      this.props.handleFilterChange("map", imageIDs);
      this.setState({ filterBounds: markerCluster.bounds_ });
    }
  };

  onClearFilter = () => {
    this.props.handleFilterChange("map");
    this.setState({ filterBounds: undefined });
  };

  getQuery(properties) {
    this.setState({ loading: true });
    let s = Utilities.dbSquelFrom()
      .field("images.id_local")
      .field("exif.gpsLatitude")
      .field("exif.gpsLongitude")
      .where("exif.hasGPS = 1");

    _.forOwn(_.omitBy(properties.filter, _.isUndefined), (value, key) => {
      s = s.where(Utilities.getFilterExpression(key, value));
    });

    return s.toString();
  }

  transformData(properties, rawData, data) {
    return data.map(d => ({
      id: d[0],
      lat: d[1],
      lng: d[2]
    }));
  }

  handleMapLoad = map => (this.googleMapComponent = map);

  handleChange = type => {
    this.setState({
      type: type.field
    });
  };

  render() {
    let overlayView;
    if (this.state.filterBounds) {
      overlayView = (
        <OverlayView
          bounds={this.state.filterBounds}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div
            style={{
              background: "rgba(50,50,50,0.1)",
              width: "100%",
              height: "100%"
            }}
            id="overlay"
          >
            <button
              style={{ position: "absolute", top: "0", right: "0" }}
              type="button"
              onClick={this.onClearFilter}
            >
              x
            </button>
          </div>
        </OverlayView>
      );
    }

    return this.loadingWrapper(
      <div>
        <div className="form-group">
          {this.props.types.map(type =>
            <Radio
              key={type.key}
              handleFieldChange={this.handleChange}
              field={type}
              selectedField={this.state.type}
            />
          )}
        </div>
        <GoogleMapInstance
          googleMapURL="https://maps.googleapis.com/maps/api/js?v=3.exp"
          containerElement={
            <div
              style={{
                bottom: 0,
                top: "40px",
                position: "absolute",
                left: 0,
                right: 0,
                padding: "15px"
              }}
            />
          }
          mapElement={<div style={{ height: `100%` }} />}
          loadingElement={<div className="loading-wrapper loading" />}
          onMapLoad={this.handleMapLoad}
          overlayView={overlayView}
          onMarkerClick={this.handleMarkerClick}
          zoomOnClick={!this.state.filterBounds}
          data={this.state.data}
        />
      </div>
    );
  }
}
