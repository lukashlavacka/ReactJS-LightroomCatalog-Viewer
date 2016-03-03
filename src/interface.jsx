import React from 'react'
import ReactDOM from 'react'
import update from 'react-addons-update'
import _ from 'lodash'
import NProgress from 'nprogress'
import WidgetLayout from './widgets'
import WorkerWrapper from './worker-wrapper'
import { BootstrapRow } from './shared'


class FileDropWrapper extends React.Component {
    onDragEnter = (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.props.handleStatusChange("Drop file anywhere", "none")
    }

    onDragLeave = (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.props.handleStatusChange("Drag any Lightroom catalog file", "none")
    }

    onDragOver = (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.props.handleStatusChange("Drop file anywhere", "none")
    }

    onDrop = (event) => {
        event.stopPropagation();
        event.preventDefault();

        var dt = event.dataTransfer;
        var files = dt.files;

        if(files && files.length && files[0])
            this.props.handleFileChange(files[0]);
    }

    render() {
        return (
            <div style={{ height: "100%" }} onDrop={this.onDrop} onDragEnter={this.onDragEnter} onDragOver={this.onDragOver} onDragLeave={this.onDragLeave}>
                {this.props.children}
            </div>
        );
    }
}

export default class Interface extends React.Component {    
    handleFileChange = (file) => {
        this.handleProgress("start")
        this.handleStatusChange("Loading...");        
        var now = new Date();
        var sqlReader = new FileReader();
        sqlReader.onload = () => {
           this.parseData(sqlReader.result, now);
        };
        sqlReader.onprogress = (e) => {
            this.handleProgress("progress", e.loaded / e.total)
        };
        sqlReader.readAsArrayBuffer(file);
    }

    handleLoadDefaultFile = (event) =>  {
        this.handleStatusChange("Requesting catalog");        
        this.handleProgress("start")
        var now = new Date();
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'testdata/TestLR.lrcat', true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = (e) => {
            this.parseData(xhr.response, now);
        };
        xhr.onprogress = (e) => {
            this.handleProgress("progress", e.loaded / e.total)
        };
        xhr.send();
    }

    parseData(data, now) {
        var Uints = new Uint8Array(data);
        this.state.worker.open(Uints).then(() => {            
            this.handleProgress("end")
            this.handleStatusChange("Loaded in " + (new Date() - now) + " miliseconds.", "success");
            this.setState({
                dbReady: true
            })
        })
    }

    handleStatusChange = (status, statusType) => {
        console.log(status)
        return;
    }

    handleProgress = (event, value) => {
        switch(event)
        {
            case "start":
                NProgress.start()
                break;
            case "progress":
                value ? NProgress.set(value) : NProgress.inc();
                break;
            case "end":
                NProgress.done()
                break;
        }
    }

    handleFilterChange = (filterType, value) => {
        var temp = {};
        temp[filterType] = { $set: value };
        var newFilter = update(this.state.filter, temp);
             
        this.setState({
            filter: newFilter
        });
    }

    saveLocalStorage(field, value) {
        var ls = {};
        if (window.localStorage) {
            try {
                ls = JSON.parse(window.localStorage.getItem('ReactJs-LightroomCatalog-Viewer')) || {};
            } catch(e) {/*ignore*/}
        }
        ls[field] = value;
        if (window.localStorage) {
            window.localStorage.setItem('ReactJs-LightroomCatalog-Viewer', JSON.stringify(ls));
        }
    }

    getLocalStorage() {
        var ls = {};
        if (window.localStorage) {
            try {
                ls = JSON.parse(window.localStorage.getItem('ReactJs-LightroomCatalog-Viewer')) || {};
            } catch(e) {/*ignore*/}
        }
        return ls;
    }

    state = {
        worker: undefined,
        dbReady: false,
        filter: {}
    }

    componentDidMount() {
        var worker = new WorkerWrapper("node_modules/sql.js/js/worker.sql.js")
        this.setState({worker: worker})
    }

    componentWillUnmount() {
        this.state.worker.terminate();
    }

    render() {
        var content;
        if(this.state.dbReady) {
            content = 
            <div>
                <WidgetLayout worker={this.state.worker} filter={this.state.filter} handleFilterChange={this.handleFilterChange} saveLocalStorage={this.saveLocalStorage} getLocalStorage={this.getLocalStorage}/>
            </div>
        }   
        else {
            content = <BootstrapRow>
                    <p>Click this button to load <button className="btn btn-default" type="button" onClick={this.handleLoadDefaultFile}>test catalog</button> or drop anywhere on the page a Lightroom catalog file.</p>
                </BootstrapRow>;
        } 
        return (
            <FileDropWrapper handleFileChange={this.handleFileChange} handleStatusChange={this.handleStatusChange} >
                <h1>Welcome to Lightroom Catalog Reader</h1>
                {content}
            </FileDropWrapper>
        );
    }
}