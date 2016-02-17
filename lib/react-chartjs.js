/*!
 * react-charts v0.1.0
 * https://github.com/jhudson8/react-charts
 *
 *
 * Copyright (c) 2014 Joe Hudson<joehud_AT_gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function(main) {
	    if (typeof Chart === 'function') {
	        // script include
	        main(Chart);
	    } else  {
	        // AMD
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {
	            return main;
	        }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    }
	})(function(Chart) {
	  Chart.React = {
	    Bar: __webpack_require__(1),
	    Doughnut: __webpack_require__(2),
	    Line: __webpack_require__(3),
	    Pie: __webpack_require__(4),
	    PolarArea: __webpack_require__(5),
	    Radar: __webpack_require__(6)
	  };
	  return Chart;
	});



/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var vars = __webpack_require__(7);

	module.exports = vars.createClass('Bar', ['getBarsAtEvent']);


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var vars = __webpack_require__(7);

	module.exports = vars.createClass('Doughnut', ['getSegmentsAtEvent']);


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var vars = __webpack_require__(7);

	module.exports = vars.createClass('Line', ['getPointsAtEvent']);


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var vars = __webpack_require__(7);

	module.exports = vars.createClass('Pie', ['getSegmentsAtEvent']);


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var vars = __webpack_require__(7);

	module.exports = vars.createClass('PolarArea', ['getSegmentsAtEvent']);


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var vars = __webpack_require__(7);

	module.exports = vars.createClass('Radar', ['getPointsAtEvent']);


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {module.exports = {
	  createClass: function(chartType, methodNames) {
	    var classData = {
	      displayName: chartType + 'Chart',
	      getInitialState: function() { return {}; },
	      render: function() {
	        var _props = {};
	        for (var name in this.props) {
	          if (this.props.hasOwnProperty(name)) {
	            if (name !== 'data' && name !== 'options') {
	              _props[name] = this.props[name];
	            }
	          }
	        }
	        return React.createElement('canvas', _props);
	      }
	    };

	    var extras = ['clear', 'stop', 'resize', 'toBase64Image', 'generateLegend', 'update', 'addData', 'removeData'];
	    function extra(type) {
	      classData[type] = function() {
	        this.state.chart[name].apply(this.state.chart, arguments);
	      };
	    }

	    if (global.Chart) {
	      classData.componentDidMount = function() {
	        this.initializeChart(this.props);
	      };

	      classData.componentWillUnmount = function() {
	        var chart = this.state.chart;
	        chart.destroy();
	      };

	      classData.componentWillReceiveProps = function(props) {
	        var chart = this.state.chart;
	        chart.destroy();
	        this.initializeChart(props);
	      };

	      classData.initializeChart = function(props) {
	        var el = ReactDOM.findDOMNode(this);
	        var ctx = el.getContext("2d");
	        var chart = new Chart(ctx)[chartType](props.data, props.options || {});
	        this.state.chart = chart;
	      };

	      var i;
	      for (i=0; i<extras.length; i++) {
	        extra(extras[i]);
	      }
	      for (i=0; i<methodNames.length; i++) {
	        extra(methodNames[i]);
	      }
	    }

	    var React = this.React || global.React;
	    if (!React) {
	      throw new Error("The charts were not initialized with the React instance");
	    }

	    return React.createClass(classData);
	  }
	};
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ }
/******/ ])