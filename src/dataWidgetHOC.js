import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import q from "q";
import { LoadingWrapper } from "./shared";
import * as Utilities from "./utilities";

const DataWidgetHOC = Widget =>
	class extends PureComponent {
		static propTypes = {
			filter: PropTypes.object
		};

		state = {
			loading: false,
			data: []
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
			const query = Widget.getQuery(properties);
			return properties.worker.exec(query);
		}

		transformData(properties, rawData) {
			const dataset = (rawData && rawData[0] && rawData[0].values) || [];
			return q(Widget.transformData(properties, dataset, rawData));
		}

		render() {
			return (
				<LoadingWrapper
					loading={this.state.loading}
					noData={!this.state.data.length}
				>
					<Widget data={this.state.data} {...this.props} />
				</LoadingWrapper>
			);
		}
	};

export default DataWidgetHOC;

export class TestClass extends PureComponent {
	static propTypes = {
		filter: PropTypes.object,
		data: PropTypes.array
	};

	static getQuery(props) {
		return Utilities.dbSquelFrom().field("COUNT(images.id_local)").toString();
	}

	static transformData(props, data) {
		return data[0];
	}

	render() {
		return (
			<div>
				{this.props.data}
			</div>
		);
	}
}
