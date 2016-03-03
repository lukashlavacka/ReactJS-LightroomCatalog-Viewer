import React from 'react'

export class BootstrapRow extends React.Component {
    render() {
        var width = this.props.width || 12
        var widths = {
            xs : this.props.xs || width,
            sm : this.props.sm || this.props.xs || width,
            md : this.props.md || this.props.sm || this.props.xs || width,
            lg : this.props.lg || this.props.md || this.props.sm || this.props.xs || width,
        }
        var classes = _(widths)
            .mapValues((value, key) => { return "col-" + key + "-" + value})
            .values()
            .join(" ");

        var children;
        if(Array.isArray(this.props.children)) {
            children = this.props.children.map((c, i) => {
                    return <div key={i} className={classes}>{c}</div>
                });
        }
        else {
            children = <div className={classes}>{this.props.children}</div>
        }
        return (
            <div className="row">                
                {children}
            </div>
        );
    }
}

export class LoadingWrapper extends React.Component {
    render() {
        var className = this.props.loading ? "loading" : null
        return (
            <div className={className}>{this.props.children}</div>
        );
    }
}