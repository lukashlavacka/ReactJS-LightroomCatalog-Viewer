import React from 'react';
import _ from 'lodash';

export class BootstrapRow extends React.Component {
    static propTypes = {
        width: React.PropTypes.number,
        xs: React.PropTypes.number,
        sm: React.PropTypes.number,
        md: React.PropTypes.number,
        lg: React.PropTypes.number,
        children: React.PropTypes.oneOfType([
            React.PropTypes.object,
            React.PropTypes.array
        ])
    }

    render() {
        const width = this.props.width || 12;
        const widths = {
            xs: this.props.xs || width,
            sm: this.props.sm || this.props.xs || width,
            md: this.props.md || this.props.sm || this.props.xs || width,
            lg: this.props.lg || this.props.md || this.props.sm || this.props.xs || width
        };
        const classes = _(widths)
            .mapValues((value, key) => {
                return `col-${key}-value`;
            })
            .values()
            .join(' ');

        let children;
        if (Array.isArray(this.props.children)) {
            children = this.props.children.map((c, i) => {
                return <div key={i} className={classes}>{c}</div>;
            });
        } else {
            children = <div className={classes}>{this.props.children}</div>;
        }
        return (
            <div className="row">
                {children}
            </div>
        );
    }
}

export class LoadingWrapper extends React.Component {
    static propTypes = {
        loading: React.PropTypes.bool,
        children: React.PropTypes.oneOfType([
            React.PropTypes.object,
            React.PropTypes.array
        ])
    }
    render() {
        const className = `loading-wrapper ${this.props.loading === true ? ' loading' : ''}`;
        return (
            <div className={className}>{this.props.children}</div>
        );
    }
}
