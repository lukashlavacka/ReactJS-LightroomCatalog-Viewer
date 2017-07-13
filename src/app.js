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

  onDragEnter = event => {
    event.stopPropagation();
    event.preventDefault();
    this.props.handleStatusChange("Drop file anywhere", "none");
  };

  onDragLeave = event => {
    event.stopPropagation();
    event.preventDefault();
    this.props.handleStatusChange("Drag any Lightroom catalog file", "none");
  };

  onDragOver = event => {
    event.stopPropagation();
    event.preventDefault();
    this.props.handleStatusChange("Drop file anywhere", "none");
  };

  onDrop = event => {
    event.stopPropagation();
    event.preventDefault();

    const dt = event.dataTransfer;
    const files = dt.files;

    if (files && files.length && files[0]) {
      this.props.handleFileChange(files[0]);
    }
  };

  render = () =>
    <div
      ref="fileDropWrapper"
      className="file-drop-wrapper"
      onDrop={this.onDrop}
      onDragEnter={this.onDragEnter}
      onDragOver={this.onDragOver}
      onDragLeave={this.onDragLeave}
    >
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
        <button
          type="button"
          className="btn"
          onClick={this.props.handleLoadDefaultFile}
        >
          Load test catalog
        </button>
      </form>
    );
  }
}

export default class App extends PureComponent {
  static propTypes = {
    isLocalFile: PropTypes.bool
  };

  static defaultProps = {
    isLocalFile: window.location.protocol === "file:"
  };

  constructor(props) {
    super(props);
    let worker;
    if (this.props.isLocalFile) {
      worker = new SyncWorkerWrapper();
    } else {
      worker = new AsyncWorkerWrapper("./worker.sql.js");
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
    if (window.localStorage) {
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
    if (window.localStorage) {
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
    if (window.localStorage) {
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
    this.state.worker
      .open(Uints)
      .then(() => {
        this.handleProgress("end");
        this.handleStatusChange(
          `Loaded in ${new Date() - now} miliseconds.`,
          "success"
        );
        this.setState({
          dbReady: true
        });
      })
      .done();
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
            isLocalFile={this.props.isLocalFile}
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
        <h1>Welcome to Lightroom Catalog Reader</h1>
        {content}
      </FileDropWrapper>
    );
  }
}
