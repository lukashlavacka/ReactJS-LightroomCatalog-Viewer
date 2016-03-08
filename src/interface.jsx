import React from 'react';
import update from 'react-addons-update';
import NProgress from 'nprogress';
import WidgetLayout from './widgets';
import {AsyncWorkerWrapper as WorkerWrapper} from './worker-wrapper';
import {BootstrapRow} from './shared';


class FileDropWrapper extends React.Component {
    static propTypes = {
        handleStatusChange: React.PropTypes.func.isRequired,
        handleFileChange: React.PropTypes.func.isRequired,
        children: React.PropTypes.oneOfType([
            React.PropTypes.object,
            React.PropTypes.array
        ])
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

    render() {
        return (
            <div
                style={{height: '100%'}}
                onDrop={this.onDrop}
                onDragEnter={this.onDragEnter}
                onDragOver={this.onDragOver}
                onDragLeave={this.onDragLeave}>
                    {this.props.children}
            </div>
        );
    }
}

export default class Interface extends React.Component {
    constructor(props) {
        super(props);
        let worker = new WorkerWrapper("production" === process.env.NODE_ENV ? 'js/worker.sql.js': './node_modules/sql.js/js/worker.sql.js');
        this.state = {
            worker: worker,
            filter: {}
        };
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
        this.state.worker.open(Uints).then(() => {
            this.handleProgress('end');
            this.handleStatusChange(`Loaded in ${new Date() - now} miliseconds.`, 'success');
            this.setState({
                dbReady: true
            });
        });
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
        temp[filterType] = {$set: value};
        const newFilter = update(this.state.filter, temp);

        this.setState({
            filter: newFilter
        });
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

    state = {
        dbReady: false,
        filter: {}
    }

    componentWillUnmount() {
        this.state.worker.terminate();
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
                        getLocalStorage={this.getLocalStorage}/>
                </div>
            );
        } else {
            content = (
                <BootstrapRow>
                    <p>Click this button to load&nbsp;
                    <button
                        className="btn btn-default"
                        type="button"
                        onClick={this.handleLoadDefaultFile}>
                        test catalog
                    </button>
                    &nbsp;or drop anywhere on the page a Lightroom catalog file.</p>
                </BootstrapRow>
            );
        }
        return (
            <FileDropWrapper
                handleFileChange={this.handleFileChange}
                handleStatusChange={this.handleStatusChange}>
                    <h1>Welcome to Lightroom Catalog Reader</h1>
                    {content}
            </FileDropWrapper>
        );
    }
}
