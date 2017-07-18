import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import * as Utilities from "../common/utilities";
import DataWidget from "../common/dataWidget";

export default class PhotoStats extends DataWidget {
  static propTypes = {
    ...DataWidget.propTypes,
    popularStats: PropTypes.array.isRequired
  };

  static defaultProps = {
    ...DataWidget.defaultProps,
    popularStats: [
      { key: "camera", field: "camera.value", name: "Camera Model" },
      { key: "lens", field: "lens.value", name: "Lens" },
      {
        key: "focalLength",
        field: "exif.focalLength",
        name: "Focal Length"
      },
      { key: "aperture", field: "ROUND(exif.aperture, 2)", name: "Aperture" },
      { key: "iso", field: "exif.isoSpeedRating", name: "ISO" },
      {
        key: "shutter",
        field: "exif.shutterSpeed",
        name: "Shutter Speed"
      }
    ]
  };

  getQuery(properties) {
    const queries = this.props.popularStats.map(s => {
      let statQuery = Utilities.dbSquelFrom()
        .field(s.field)
        .field("COUNT(images.id_local)")
        .where(`${s.field} IS NOT NULL`)
        .group(s.field)
        .order("COUNT(images.id_local)", false)
        .limit(1);

      _.forOwn(_.omitBy(properties.filter, _.isUndefined), (value, key) => {
        statQuery = statQuery.where(Utilities.getFilterExpression(key, value));
      });
      return statQuery;
    });

    let sumQuery = Utilities.dbSquelFrom().field("COUNT(images.id_local)");

    _.forOwn(_.omitBy(properties.filter, _.isUndefined), (value, key) => {
      sumQuery = sumQuery.where(Utilities.getFilterExpression(key, value));
    });

    queries.unshift(sumQuery);

    return queries.join(";");
  }

  transformData(properties, rawData, data) {
    const dataset = rawData || [];

    const totalCountDataset = dataset.splice(0, 1);
    const totalCount =
      (totalCountDataset[0] && totalCountDataset[0].values[0][0]) || 1;

    return dataset.map((d, i) => {
      const stat = this.props.popularStats[i];
      return {
        key: stat.key,
        name: stat.name,
        value: Utilities.formatDbValue(stat.key, d.values[0][0]),
        count: d.values[0][1],
        percentage: d.values[0][1] / totalCount
      };
    });
  }

  render() {
    if (this.state.data && this.state.data.map)
      return this.loadingWrapper(
        <table className="table table-sm table-hover no-bottom-margin">
          <thead>
            <tr>
              {this.state.data.map(s =>
                <th key={s.key}>
                  {s.name}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              {this.state.data.map(s =>
                <td key={s.key}>
                  {s.value}
                </td>
              )}
            </tr>
            <tr>
              {this.state.data.map(s =>
                <td key={s.key}>
                  {s.count} photo(s) / {Math.round(s.percentage * 100)}%
                </td>
              )}
            </tr>
          </tbody>
        </table>
      );
  }
}
