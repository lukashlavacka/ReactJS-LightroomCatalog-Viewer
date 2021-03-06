import React from "react";
import ReactDOM from "react-dom";

import "./index.css";
import "bootstrap/dist/css/bootstrap.css";
import "font-awesome/css/font-awesome.css";

import App from "./app";
import registerServiceWorker from "./registerServiceWorker";
import { configureLogging } from "./common/utilities";

ReactDOM.render(<App />, document.getElementById("root"));
if (!process.env.REACT_APP_CHROME && !process.env.REACT_APP_FILE)
	registerServiceWorker();
configureLogging();
