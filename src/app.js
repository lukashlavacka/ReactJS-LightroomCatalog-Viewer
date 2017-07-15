import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import update from "immutability-helper";
import NProgress from "nprogress";
import WidgetLayout from "./widgets";
import { SyncWorkerWrapper, AsyncWorkerWrapper } from "./common/worker-wrapper";
import { BootstrapRow } from "./common/shared";

class FileDropWrapper extends PureComponent {
  static propTypes = {
    handleStatusChange: PropTypes.func.isRequired,
    handleFileChange: PropTypes.func.isRequired,
    children: PropTypes.node
  };

  state = { dragging: false };

  onDragEnter = event => {
    event.stopPropagation();
    event.preventDefault();
    this.setState({ dragging: true });
    this.props.handleStatusChange("Drop file anywhere", "none");
  };

  onDragLeave = event => {
    event.stopPropagation();
    event.preventDefault();
    this.setState({ dragging: false });
    this.props.handleStatusChange("Drag any Lightroom catalog file", "none");
  };

  onDragOver = event => {
    event.stopPropagation();
    event.preventDefault();
    this.setState({ dragging: true });
    this.props.handleStatusChange("Drop file anywhere", "none");
  };

  onDrop = event => {
    event.stopPropagation();
    event.preventDefault();

    this.setState({ dragging: false });
    const dt = event.dataTransfer;
    const files = dt.files;

    if (files && files.length && files[0]) {
      this.props.handleFileChange(files[0]);
    }
  };

  render = () =>
    <div
      className={`file-drop-wrapper ${this.state.dragging ? "dragging" : ""}`}
      onDrop={this.onDrop}
      onDragEnter={this.onDragEnter}
      onDragOver={this.onDragOver}
      onDragLeave={this.onDragLeave}
    >
      <div className="file-drop-message">
        <div className="alert alert-success">Drop file anywhere</div>
      </div>
      <div ref="fileDropWrapper" className="file-drop-element" />
      {this.props.children}
    </div>;
}

class FileInput extends PureComponent {
  static propTypes = {
    handleStatusChange: PropTypes.func.isRequired,
    handleFileChange: PropTypes.func.isRequired,
    handleLoadDefaultFile: PropTypes.func.isRequired,
    accept: PropTypes.string
  };

  onChange = event => {
    event.stopPropagation();
    event.preventDefault();

    const files = this.refs.fileInput.files;

    if (files && files.length && files[0]) {
      this.props.handleFileChange(files[0]);
    }
  };

  render() {
    return (
      <form className="form-inline" onSubmit={this.onChange}>
        <div className="form-group">
          <input
            ref="fileInput"
            type="file"
            required="required"
            accept={this.props.accept}
          />
        </div>
        <button type="submit" className="btn btn-default">
          Open catalog
        </button>
        {!this.props.isLocalFile
          ? <button
              type="button"
              className="btn"
              onClick={this.props.handleLoadDefaultFile}
            >
              Load test catalog
            </button>
          : null}
      </form>
    );
  }
}

export default class App extends PureComponent {
  static propTypes = {
    isLocalFile: PropTypes.bool
  };

  static defaultProps = {
    isLocalFile: process.env.REACT_APP_FILE
  };

  constructor(props) {
    super(props);
    let worker;
    if (this.props.isLocalFile) {
      worker = new SyncWorkerWrapper("./lib/sql.js");
    } else if (process.env.REACT_APP_CHROME) {
      worker = new AsyncWorkerWrapper("./lib/worker.sql-noEval.js");
    } else {
      worker = new AsyncWorkerWrapper("./lib/worker.sql.js");
    }
    this.state = {
      worker,
      filter: {}
    };
  }

  state = {
    dbReady: false,
    filter: {}
  };

  componentWillUnmount() {
    this.state.worker.terminate();
  }

  getLocalStorage() {
    let ls = {};
    if (!process.env.REACT_APP_CHROME && window.localStorage) {
      try {
        ls =
          JSON.parse(
            window.localStorage.getItem("ReactJs-LightroomCatalog-Viewer")
          ) || {};
      } catch (e) {
        /* ignore */
      }
    }
    return ls;
  }

  saveLocalStorage(field, value) {
    let ls = {};
    if (!process.env.REACT_APP_CHROME && window.localStorage) {
      try {
        ls =
          JSON.parse(
            window.localStorage.getItem("ReactJs-LightroomCatalog-Viewer")
          ) || {};
      } catch (e) {
        /* ignore */
      }
    }
    ls[field] = value;
    if (!process.env.REACT_APP_CHROME && window.localStorage) {
      window.localStorage.setItem(
        "ReactJs-LightroomCatalog-Viewer",
        JSON.stringify(ls)
      );
    }
  }

  handleFileChange = file => {
    this.setState({
      dbReady: false
    });
    this.handleProgress("start");
    this.handleStatusChange("Loading...");
    const now = new Date();
    const sqlReader = new FileReader();
    sqlReader.onload = () => {
      this.parseData(sqlReader.result, now);
    };
    sqlReader.onprogress = e => {
      this.handleProgress("progress", e.loaded / e.total);
    };
    sqlReader.readAsArrayBuffer(file);
  };

  handleLoadDefaultFile = () => {
    this.handleStatusChange("Requesting catalog");
    this.handleProgress("start");
    const now = new Date();
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "testdata/TestLR.lrcat", true);
    xhr.responseType = "arraybuffer";

    xhr.onload = () => {
      this.parseData(xhr.response, now);
    };
    xhr.onprogress = e => {
      this.handleProgress("progress", e.loaded / e.total);
    };
    xhr.send();
  };

  parseData(data, now) {
    const Uints = new Uint8Array(data);
    this.state.worker.open(Uints).then(() => {
      this.handleProgress("end");
      this.handleStatusChange(
        `Loaded in ${new Date() - now} miliseconds.`,
        "success"
      );
      this.setState({
        dbReady: true
      });
    });
  }

  handleStatusChange = status => {
    window.console.log(status);
    return;
  };

  handleProgress = (event, value) => {
    switch (event) {
      default:
      case "start":
        NProgress.start();
        break;
      case "progress":
        if (value) {
          NProgress.set(value);
        } else {
          NProgress.inc();
        }
        break;
      case "end":
        NProgress.done();
        break;
    }
  };

  handleFilterChange = (filterType, value) => {
    const temp = {};
    temp[filterType] = { $set: value };
    const newFilter = update(this.state.filter, temp);

    this.setState({
      filter: newFilter
    });
  };

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
            isLocalFile={this.props.isLocalFile || process.env.REACT_APP_CHROME}
          />
        </div>
      );
    } else {
      content = (
        <BootstrapRow sm={6} xs={12}>
          <p>
            Drop anywhere on the page a Lightroom catalog file or select a file
          </p>
          <FileInput
            handleFileChange={this.handleFileChange}
            handleStatusChange={this.handleStatusChange}
            handleLoadDefaultFile={this.handleLoadDefaultFile}
            isLocalFile={this.props.isLocalFile}
            accept=".lrcat"
          />
        </BootstrapRow>
      );
    }
    return (
      <FileDropWrapper
        handleFileChange={this.handleFileChange}
        handleStatusChange={this.handleStatusChange}
      >
        <div className="container">
          <div className="page-header">
            <h1>Welcome to Lightroom Catalog Reader</h1>
          </div>
          {content}
        </div>
      </FileDropWrapper>
    );
  }
}
