import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import q from "q";
import { LoadingWrapper } from "./shared";
import * as Utilities from "./utilities";

export default class DataWidget extends PureComponent {
	static propTypes = {
		filter: PropTypes.object
	};

	state = {
		loading: false,
		data: []
	};

	componentDidMount() {
		this.getData(this.props)
			.then(this.transformDataPromise.bind(this, this.props))
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
			.then(this.transformDataPromise.bind(this, nextProps))
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
		const query = this.getQuery(properties);
		return properties.worker.exec(query);
	}

	transformDataPromise(properties, rawData) {
		const dataset = (rawData && rawData[0] && rawData[0].values) || [];
		return q(this.transformData(properties, dataset, rawData));
	}

	wrapper(content) {
		return (
			<LoadingWrapper
				loading={this.state.loading}
				noData={!this.state.data.length}
			>
				{content}
			</LoadingWrapper>
		);
	}
}

export class TestClass extends DataWidget {
	getQuery(props) {
		return Utilities.dbSquelFrom().field("COUNT(images.id_local)").toString();
	}

	transformData(props, data) {
		return data[0];
	}

	render() {
		return this.wrapper(
			<div>
				{this.state.data}
			</div>
		);
	}
}
