import React from 'react';
import _ from 'lodash';

export const BootstrapRow = (props) => {
    const width = props.width || 12;
    const widths = {
        xs: props.xs || width,
        sm: props.sm || props.xs || width,
        md: props.md || props.sm || props.xs || width,
        lg: props.lg || props.md || props.sm || props.xs || width,
    };
    const classes = _(widths)
        .mapValues((value, key) => `col-${key}-${value}`)
        .values()
        .join(' ');

    let children;
    if (Array.isArray(props.children)) {
        children = props.children.map((c, i) =>
            <div key={i} className={classes}>{c}</div>
        );
    } else {
        children = <div className={classes}>{props.children}</div>;
    }
    return (
        <div className="row">
            {children}
        </div>
    );
};
BootstrapRow.propTypes = {
    width: React.PropTypes.number,
    xs: React.PropTypes.number,
    sm: React.PropTypes.number,
    md: React.PropTypes.number,
    lg: React.PropTypes.number,
    children: React.PropTypes.node,
};

export const LoadingWrapper = (props) =>
    <div className={`loading-wrapper ${props.loading === true ? ' loading' : ''}`}>
        {props.children}
    </div>;
LoadingWrapper.propTypes = {
    loading: React.PropTypes.bool,
    children: React.PropTypes.node,
};

export class Checkbox extends React.Component {
    static propTypes = {
        handleFieldChange: React.PropTypes.func.isRequired,
        field: React.PropTypes.object.isRequired,
        selectedField: React.PropTypes.string,
    }

    handleFieldChange =
        (event) => this.props.handleFieldChange(this.props.field, event.target.value)

    render() {
        return (
            <label
                key={this.props.field.field}
                className="radio-inline"
            >
                <input
                    ref="radioField"
                    type="radio"
                    checked={this.props.selectedField === this.props.field.field}
                    value={this.props.field.field}
                    onChange={this.handleFieldChange}
                />{this.props.field.name}
            </label>
        );
    }
}
