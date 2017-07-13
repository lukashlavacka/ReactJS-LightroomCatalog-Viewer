import React from "react";
import ReactDOM from "react-dom";

import "./index.css";
import "bootstrap/dist/css/bootstrap.css";
import "nprogress/nprogress.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-grid-layout/css/styles.css";
import "./app.css";

import App from "./app";
import registerServiceWorker from "./registerServiceWorker";
import { configureLogging } from "./common/utilities";

ReactDOM.render(<App />, document.getElementById("root"));
if (window.location.protocol !== "file:") registerServiceWorker();
configureLogging();
