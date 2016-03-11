import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import update from 'react-addons-update';
import NProgress from 'nprogress';
import WidgetLayout from './widgets';
import { AsyncWorkerWrapper as WorkerWrapper } from './worker-wrapper';
import { BootstrapRow } from './shared';


// eslint-disable-next-line react/prefer-stateless-function
class FileDropWrapper extends React.Component {
    static propTypes = {
        handleStatusChange: React.PropTypes.func.isRequired,
        handleFileChange: React.PropTypes.func.isRequired,
        children: React.PropTypes.node,
    }

    constructor(props) {
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
    }

    onDragEnter = (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.props.handleStatusChange('Drop file anywhere', 'none');
    }

    onDragLeave = (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.props.handleStatusChange('Drag any Lightroom catalog file', 'none');
    }

    onDragOver = (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.props.handleStatusChange('Drop file anywhere', 'none');
    }

    onDrop = (event) => {
        event.stopPropagation();
        event.preventDefault();

        const dt = event.dataTransfer;
        const files = dt.files;

        if (files && files.length && files[0]) {
            this.props.handleFileChange(files[0]);
        }
    }

    render = () =>
        <div
            ref="fileDropWrapper"
            style={{ height: '100%' }}
            onDrop={this.onDrop}
            onDragEnter={this.onDragEnter}
            onDragOver={this.onDragOver}
            onDragLeave={this.onDragLeave}
        >
            {this.props.children}
        </div>
}

class FileInput extends React.Component {
    static propTypes = {
        handleStatusChange: React.PropTypes.func.isRequired,
        handleFileChange: React.PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
    }

    onChange = (event) => {
        event.stopPropagation();
        event.preventDefault();

        const files = this.refs.fileInput.files;

        if (files && files.length && files[0]) {
            this.props.handleFileChange(files[0]);
        }
    }

    render() {
        return (<form className="form-inline" onSubmit={this.onChange}>
            <div className="form-group">
                <input ref="fileInput" type="file" required="required" />
            </div>
            <button type="submit" className="btn btn-default">Open catalog</button>
        </form>);
    }
}

export default class Interface extends React.Component {
    constructor(props) {
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
        const worker = new WorkerWrapper(
            process.env.NODE_ENV === 'production' ?
                'js/worker.sql.js' :
                './node_modules/sql.js/js/worker.sql.js'
        );
        this.state = {
            worker,
            filter: {},
        };
    }

    state = {
        dbReady: false,
        filter: {},
    }

    componentDidMount() {
        if (process.env.NODE_ENV === 'development') {
            this.handleLoadDefaultFile();
        }
    }

    componentWillUnmount() {
        this.state.worker.terminate();
    }

    getLocalStorage() {
        let ls = {};
        if (window.localStorage) {
            try {
                ls = JSON.parse(window.localStorage.getItem('ReactJs-LightroomCatalog-Viewer'))
                    || {};
            } catch (e) {
                /* ignore */
            }
        }
        return ls;
    }

    saveLocalStorage(field, value) {
        let ls = {};
        if (window.localStorage) {
            try {
                ls = JSON.parse(window.localStorage.getItem('ReactJs-LightroomCatalog-Viewer'))
                    || {};
            } catch (e) {
                /* ignore */
            }
        }
        ls[field] = value;
        if (window.localStorage) {
            window.localStorage.setItem('ReactJs-LightroomCatalog-Viewer', JSON.stringify(ls));
        }
    }

    handleFileChange = (file) => {
        this.handleProgress('start');
        this.handleStatusChange('Loading...');
        const now = new Date();
        const sqlReader = new FileReader();
        sqlReader.onload = () => {
            this.parseData(sqlReader.result, now);
        };
        sqlReader.onprogress = (e) => {
            this.handleProgress('progress', e.loaded / e.total);
        };
        sqlReader.readAsArrayBuffer(file);
    }

    handleLoadDefaultFile = () => {
        this.handleStatusChange('Requesting catalog');
        this.handleProgress('start');
        const now = new Date();
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'testdata/TestLR.lrcat', true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = () => {
            this.parseData(xhr.response, now);
        };
        xhr.onprogress = (e) => {
            this.handleProgress('progress', e.loaded / e.total);
        };
        xhr.send();
    }

    parseData(data, now) {
        const Uints = new Uint8Array(data);
        this.state.worker.open(Uints)
            .then(() => {
                this.handleProgress('end');
                this.handleStatusChange(`Loaded in ${new Date() - now} miliseconds.`, 'success');
                this.setState({
                    dbReady: true,
                });
            })
            .done();
    }

    handleStatusChange = (status) => {
        window.console.log(status);
        return;
    }

    handleProgress = (event, value) => {
        switch (event) {
            default:
            case 'start':
                NProgress.start();
                break;
            case 'progress':
                if (value) {
                    NProgress.set(value);
                } else {
                    NProgress.inc();
                }
                break;
            case 'end':
                NProgress.done();
                break;
        }
    }

    handleFilterChange = (filterType, value) => {
        const temp = {};
        temp[filterType] = { $set: value };
        const newFilter = update(this.state.filter, temp);

        this.setState({
            filter: newFilter,
        });
    }

    render() {
        let content;
        if (this.state.dbReady) {
            content = (
                <div>
                    <WidgetLayout
                        worker={this.state.worker}
                        filter={this.state.filter}
                        handleFilterChange={this.handleFilterChange}
                        saveLocalStorage={this.saveLocalStorage}
                        getLocalStorage={this.getLocalStorage}
                    />
                </div>
            );
        } else {
            content = (
                <BootstrapRow sm="{6}" xs="{12}">
                    <p>Drop anywhere on the page a Lightroom catalog file or select a file</p>
                    <FileInput
                        handleFileChange={this.handleFileChange}
                        handleStatusChange={this.handleStatusChange}
                    />
                </BootstrapRow>
            );
        }
        return (
            <FileDropWrapper
                handleFileChange={this.handleFileChange}
                handleStatusChange={this.handleStatusChange}
            >
                <h1>Welcome to Lightroom Catalog Reader</h1>
                {content}
            </FileDropWrapper>
        );
    }
}
