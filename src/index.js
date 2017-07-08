import React from "react";
import ReactDOM from "react-dom";

import "./index.css";
import "./app.css";
import "bootstrap/dist/css/bootstrap.css";
import "nprogress/nprogress.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-grid-layout/css/styles.css";

import App from "./app";
import registerServiceWorker from "./registerServiceWorker";

ReactDOM.render(<App />, document.getElementById("root"));
registerServiceWorker();
