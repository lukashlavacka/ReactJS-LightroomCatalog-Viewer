import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import squel from "squel";
import * as Utilities from "../common/utilities";
import DataWidget from "../common/dataWidget";

export default class Recommendation extends DataWidget {
	static propTypes = {
		...DataWidget.propTypes,
		recommendations: PropTypes.array.isRequired
	};

	static defaultProps = {
		...DataWidget.defaultProps,
		recommendations: [
			{
				key: "lensMinMax",
				name: "Expand your lens range",
				text: data =>
					`You took ${data.totalCount} pictures with ${data.lensName} lens. Out of those ${Math.round(
						data.maxFocalLengthCount * 10 / data.totalCount
					) *
						10}% has been taken at the maximal focal length of ${Utilities.formatDbValue(
						"focalLength",
						data.maxFocalLength
					)} and ${Math.round(data.minFocalLengthCount * 10 / data.totalCount) *
						10}% has been taken at the minimal focal length of ${Utilities.formatDbValue(
						"focalLength",
						data.minFocalLength
					)}. Consider buying or carrying shorter or longer lens`,
				query: Utilities.dbSquelFrom()
					.distinct()
					.field("'lensMinMax'", "key")
					.field("lens.value", "lensName")
					.field("COUNT(images.id_local)", "totalCount")
					.field("maxQuery.focalLength", "maxFocalLength")
					.field("maxQuery.focalLengthCount", "maxFocalLengthCount")
					.field("minQuery.focalLength", "minFocalLength")
					.field("minQuery.focalLengthCount", "minFocalLengthCount")
					.join(
						Utilities.dbSquelFrom()
							.field("exif.lensRef")
							.field("exif.focalLength")
							.field("COUNT(images.id_local)", "focalLengthCount")
							.join(
								Utilities.dbSquelFrom()
									.field("exif.lensRef")
									.field("MAX(exif.focalLength)", "focalLength")
									.group("exif.lensRef"),
								"mq1",
								"mq1.lensRef = exif.lensRef AND mq1.focalLength = exif.focalLength"
							)
							.group("exif.lensRef"),
						"maxQuery",
						"maxQuery.lensRef = exif.lensRef"
					)
					.join(
						Utilities.dbSquelFrom()
							.field("exif.lensRef")
							.field("exif.focalLength")
							.field("COUNT(images.id_local)", "focalLengthCount")
							.join(
								Utilities.dbSquelFrom()
									.field("exif.lensRef")
									.field("MIN(exif.focalLength)", "focalLength")
									.group("exif.lensRef"),
								"mq2",
								"mq2.lensRef = exif.lensRef AND mq2.focalLength = exif.focalLength"
							)
							.group("exif.lensRef"),
						"minQuery",
						"minQuery.lensRef = exif.lensRef"
					)
					.where("maxQuery.focalLength != minQuery.focalLength")
					.group("exif.lensRef")
					.having(
						squel
							.expr()
							.and("maxQuery.focalLengthCount * 10 > COUNT(images.id_local)")
							.or("minQuery.focalLengthCount * 10 > COUNT(images.id_local)")
					)
			}
		]
	};

	constructor(props) {
		super(props);
		this.state = Object.assign(this.state, { applyFilter: false });
	}

	getQuery(properties) {
		const queries = this.props.recommendations.map(r => r.query.toString());

		return queries.join(";");
	}

	resultDataToObject(data, index) {
		return _.zipObject(data.columns, data.values[index]);
	}

	transformData(properties, rawData, data) {
		return rawData.map((d, di) => {
			var recommendation = _.find(properties.recommendations, {
				key: d.values[0][0]
			});
			return {
				name: recommendation.name,
				key: recommendation.key,
				items: d.values.map((v, vi) => {
					var dataObject = this.resultDataToObject(d, vi);
					return {
						value: recommendation.text(dataObject),
						index: vi
					};
				})
			};
		});
	}

	render() {
		return this.loadingWrapper(
			<ul>
				{this.state.data.map(r =>
					<li key={r.key}>
						{r.name}
						<ul>
							{r.items.map(ri =>
								<li key={ri.index}>
									{ri.value}
								</li>
							)}
						</ul>
					</li>
				)}
			</ul>
		);
	}
}
