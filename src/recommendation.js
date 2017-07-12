import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import q from "q";
import _ from "lodash";
import squel from "squel";
import { LoadingWrapper } from "./shared";
import * as Utilities from "./utilities";

export default class Recommendation extends PureComponent {
	static propTypes = {
		recommendations: PropTypes.array.isRequired,
		filter: PropTypes.object
	};

	static defaultProps = {
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

	state = {
		loading: false,
		data: [],
		applyFilter: false
	};

	componentDidMount() {
		this.getData(this.props)
			.then(this.transformData.bind(this, this.props))
			.then(data => {
				this.setState({
					data,
					loading: false
				});
			})
			.done();
	}

	componentWillReceiveProps(nextProps) {
		this.getData(nextProps)
			.then(this.transformData.bind(this, nextProps))
			.then(data => {
				this.setState({
					data,
					loading: false
				});
			})
			.done();
	}

	getData(properties) {
		this.setState({ loading: true });
		const queries = this.props.recommendations.map(r => r.query.toString());

		const query = queries.join(";");

		return properties.worker.exec(query);
	}

	resultDataToObject(data, index) {
		return _.zipObject(data.columns, data.values[index]);
	}

	transformData(properties, rawData) {
		return q(
			rawData.map((d, di) => {
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
			})
		);
	}

	render() {
		return (
			<LoadingWrapper
				loading={this.state.loading}
				noData={!this.state.data.length}
			>
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
			</LoadingWrapper>
		);
	}
}
