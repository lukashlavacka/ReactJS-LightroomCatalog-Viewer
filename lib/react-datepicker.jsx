var DateInput = React.createClass({

  propTypes: {
    date: React.PropTypes.object,
    locale: React.PropTypes.string,
    minDate: React.PropTypes.object,
    maxDate: React.PropTypes.object,
    excludeDates: React.PropTypes.array,
    includeDates: React.PropTypes.array,
    filterDate: React.PropTypes.func,
    open: React.PropTypes.bool
  },

  getDefaultProps() {
    return {
      dateFormat: "YYYY-MM-DD"
    };
  },

  getInitialState() {
    return {
      maybeDate: this.safeDateFormat(this.props.date)
    };
  },

  componentWillReceiveProps(newProps) {
    if (!isSameDay(newProps.date, this.props.date)) {
      this.setState({
        maybeDate: this.safeDateFormat(newProps.date)
      });
    }
  },

  handleChange(event) {
    var value = event.target.value;
    var date = moment(value, this.props.dateFormat, true);
    if (date.isValid() && !isDayDisabled(date, this.props)) {
      this.props.setSelected(date);
    } else if (value === "") {
      this.props.setSelected(null);
    }
    this.setState({
      maybeDate: value
    });
  },

  safeDateFormat(date) {
    return date && date.clone()
      .locale(this.props.locale || moment.locale())
      .format(this.props.dateFormat);
  },

  handleKeyDown(event) {
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      this.props.handleDone();
    } else if (event.key === "Tab") {
      this.props.handleDone();
    }
  },

  handleClick(event) {
    if (!this.props.disabled) {
      this.props.handleClick(event);
    }
  },

  handleBlur(event) {
    this.setState({
      maybeDate: this.safeDateFormat(this.props.date)
    });
    if (this.props.onBlur) {
      this.props.onBlur(event);
    }
  },

  focus() {
    this.refs.input.focus();
  },

  getClassNames() {
    return classNames(
      "datepicker__input",
      { "ignore-react-onclickoutside": this.props.open },
      this.props.className);
  },

  render() {
    return <input
        ref="input"
        type="text"
        id={this.props.id}
        name={this.props.name}
        value={this.state.maybeDate}
        onClick={this.handleClick}
        onKeyDown={this.handleKeyDown}
        onFocus={this.props.onFocus}
        onBlur={this.handleBlur}
        onChange={this.handleChange}
        className={this.getClassNames()}
        disabled={this.props.disabled}
        placeholder={this.props.placeholderText}
        readOnly={this.props.readOnly}
        required={this.props.required}
        tabIndex={this.props.tabIndex} />;
  }
});

var Calendar = React.createClass({
  mixins: [OnClickOutside],

  propTypes: {
    locale: React.PropTypes.string,
    dateFormat: React.PropTypes.string.isRequired,
    onSelect: React.PropTypes.func.isRequired,
    onClickOutside: React.PropTypes.func.isRequired,
    minDate: React.PropTypes.object,
    maxDate: React.PropTypes.object,
    startDate: React.PropTypes.object,
    endDate: React.PropTypes.object,
    excludeDates: React.PropTypes.array,
    includeDates: React.PropTypes.array,
    filterDate: React.PropTypes.func,
    showYearDropdown: React.PropTypes.bool
  },

  handleClickOutside(event) {
    this.props.onClickOutside(event);
  },

  getInitialState() {
    return {
      date: this.localizeMoment(this.getDateInView())
    };
  },

  getDateInView() {
    const { selected, minDate, maxDate } = this.props;
    const current = moment();
    if (selected) {
      return selected;
    } else if (minDate && minDate.isAfter(current)) {
      return minDate;
    } else if (maxDate && maxDate.isBefore(current)) {
      return maxDate;
    } else {
      return current;
    }
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.selected && !isSameDay(nextProps.selected, this.props.selected)) {
      this.setState({
        date: this.localizeMoment(nextProps.selected)
      });
    }
  },

  localizeMoment(date) {
    return date.clone().locale(this.props.locale || moment.locale());
  },

  increaseMonth() {
    this.setState({
      date: this.state.date.clone().add(1, "month")
    });
  },

  decreaseMonth() {
    this.setState({
      date: this.state.date.clone().subtract(1, "month")
    });
  },

  handleDayClick(day) {
    this.props.onSelect(day);
  },

  changeYear(year) {
    this.setState({
      date: this.state.date.clone().set("year", year)
    });
  },

  header() {
    const startOfWeek = this.state.date.clone().startOf("week");
    return [0, 1, 2, 3, 4, 5, 6].map(offset => {
      const day = startOfWeek.clone().add(offset, "days");
      return (
        <div key={offset} className="datepicker__day">
          {day.localeData().weekdaysMin(day)}
        </div>
      );
    });
  },

  renderCurrentMonth() {
    var classes = ["datepicker__current-month"];
    if (this.props.showYearDropdown) {
      classes.push("datepicker__current-month--hasYearDropdown");
    }
    return (
      <div className={classes.join(" ")}>
        {this.state.date.format(this.props.dateFormat)}
      </div>
    );
  },

  renderYearDropdown() {
    if (!this.props.showYearDropdown) {
      return;
    }
    return (
      <YearDropdown
        onChange={this.changeYear}
        year={this.state.date.year()} />
    );
  },

  renderTodayButton() {
    if (!this.props.todayButton) {
      return;
    }
    return (
      <div className="datepicker__today-button" onClick={() => this.props.onSelect(moment())}>
        {this.props.todayButton}
      </div>
    );
  },

  render() {
    return (
      <div className="datepicker">
        <div className="datepicker__triangle"></div>
        <div className="datepicker__header">
          <a className="datepicker__navigation datepicker__navigation--previous"
              onClick={this.decreaseMonth}>
          </a>
          {this.renderCurrentMonth()}
          {this.renderYearDropdown()}
          <a className="datepicker__navigation datepicker__navigation--next"
              onClick={this.increaseMonth}>
          </a>
          <div>
            {this.header()}
          </div>
        </div>
        <Month
          day={this.state.date}
          onDayClick={this.handleDayClick}
          minDate={this.props.minDate}
          maxDate={this.props.maxDate}
          excludeDates={this.props.excludeDates}
          includeDates={this.props.includeDates}
          filterDate={this.props.filterDate}
          selected={this.props.selected}
          startDate={this.props.startDate}
          endDate={this.props.endDate} />
        {this.renderTodayButton()}
      </div>
    );
  }
});

var Day = React.createClass({
  displayName: "Day",

  propTypes: {
    day: React.PropTypes.object.isRequired,
    month: React.PropTypes.number,
    onClick: React.PropTypes.func,
    minDate: React.PropTypes.object,
    maxDate: React.PropTypes.object,
    excludeDates: React.PropTypes.array,
    includeDates: React.PropTypes.array,
    filterDate: React.PropTypes.func,
    selected: React.PropTypes.object,
    startDate: React.PropTypes.object,
    endDate: React.PropTypes.object
  },

  handleClick(event) {
    if (!this.isDisabled() && this.props.onClick) {
      this.props.onClick(event);
    }
  },

  isSameDay(other) {
    return isSameDay(this.props.day, other);
  },

  isDisabled() {
    return isDayDisabled(this.props.day, this.props);
  },

  isInRange() {
    const { day, startDate, endDate } = this.props;
    if (!startDate || !endDate) return false;

    const before = startDate.clone().startOf("day").subtract(1, "seconds");
    const after = endDate.clone().startOf("day").add(1, "seconds");
    return day.clone().startOf("day").isBetween(before, after);
  },

  isWeekend() {
    const weekday = this.props.day.day();
    return weekday === 0 || weekday === 6;
  },

  isOutsideMonth() {
    return this.props.month !== undefined &&
      this.props.month !== this.props.day.month();
  },

  getClassNames() {
    return classNames("datepicker__day", {
      "datepicker__day--disabled": this.isDisabled(),
      "datepicker__day--selected": this.isSameDay(this.props.selected),
      "datepicker__day--in-range": this.isInRange(),
      "datepicker__day--today": this.isSameDay(moment()),
      "datepicker__day--weekend": this.isWeekend(),
      "datepicker__day--outside-month": this.isOutsideMonth()
    });
  },

  render() {
    return (
      <div className={this.getClassNames()} onClick={this.handleClick}>
        {this.props.day.date()}
      </div>
    );
  }
});

var Month = React.createClass({
  displayName: "Month",

  propTypes: {
    day: React.PropTypes.object.isRequired,
    onDayClick: React.PropTypes.func,
    minDate: React.PropTypes.object,
    maxDate: React.PropTypes.object,
    excludeDates: React.PropTypes.array,
    includeDates: React.PropTypes.array,
    filterDate: React.PropTypes.func,
    selected: React.PropTypes.object,
    startDate: React.PropTypes.object,
    endDate: React.PropTypes.object
  },

  handleDayClick(day) {
    if (this.props.onDayClick) {
      this.props.onDayClick(day);
    }
  },

  isWeekInMonth(startOfWeek) {
    const day = this.props.day;
    const endOfWeek = startOfWeek.clone().add(6, "days");
    return startOfWeek.isSame(day, "month") || endOfWeek.isSame(day, "month");
  },

  renderWeeks() {
    const startOfMonth = this.props.day.clone().startOf("month").startOf("week");
    return [0, 1, 2, 3, 4, 5]
      .map(offset => startOfMonth.clone().add(offset, "weeks"))
      .filter(startOfWeek => this.isWeekInMonth(startOfWeek))
      .map((startOfWeek, offset) =>
        <Week
          key={offset}
          day={startOfWeek}
          month={this.props.day.month()}
          onDayClick={this.handleDayClick}
          minDate={this.props.minDate}
          maxDate={this.props.maxDate}
          excludeDates={this.props.excludeDates}
          includeDates={this.props.includeDates}
          filterDate={this.props.filterDate}
          selected={this.props.selected}
          startDate={this.props.startDate}
          endDate={this.props.endDate} />
      );
  },

  render() {
    return (
      <div className="datepicker__month">
        {this.renderWeeks()}
      </div>
    );
  }
});

var Week = React.createClass({
  displayName: "Week",

  propTypes: {
    day: React.PropTypes.object.isRequired,
    month: React.PropTypes.number,
    onDayClick: React.PropTypes.func,
    minDate: React.PropTypes.object,
    maxDate: React.PropTypes.object,
    excludeDates: React.PropTypes.array,
    includeDates: React.PropTypes.array,
    filterDate: React.PropTypes.func,
    selected: React.PropTypes.object,
    startDate: React.PropTypes.object,
    endDate: React.PropTypes.object
  },

  handleDayClick(day) {
    if (this.props.onDayClick) {
      this.props.onDayClick(day);
    }
  },

  renderDays() {
    const startOfWeek = this.props.day.clone().startOf("week");
    return [0, 1, 2, 3, 4, 5, 6].map(offset => {
      const day = startOfWeek.clone().add(offset, "days");
      return (
        <Day
          key={offset}
          day={day}
          month={this.props.month}
          onClick={this.handleDayClick.bind(this, day)}
          minDate={this.props.minDate}
          maxDate={this.props.maxDate}
          excludeDates={this.props.excludeDates}
          includeDates={this.props.includeDates}
          filterDate={this.props.filterDate}
          selected={this.props.selected}
          startDate={this.props.startDate}
          endDate={this.props.endDate} />
      );
    });
  },

  render() {
    return (
      <div className="datepicker__week">
        {this.renderDays()}
      </div>
    );
  }
});

var YearDropdown = React.createClass({
  propTypes: {
    year: React.PropTypes.number.isRequired,
    onChange: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      dropdownVisible: false
    };
  },

  renderReadView() {
    return (
      <div className="datepicker__year-read-view" onClick={this.toggleDropdown}>
        <span className="datepicker__year-read-view--selected-year">{this.props.year}</span>
        <span className="datepicker__year-read-view--down-arrow"></span>
      </div>
    );
  },

  renderDropdown() {
    return (
      <YearDropdownOptions
        ref="options"
        year={this.props.year}
        onChange={this.onChange}
        onCancel={this.toggleDropdown} />
    );
  },

  onChange(year) {
    this.toggleDropdown();
    if (year === this.props.year) return;
    this.props.onChange(year);
  },

  toggleDropdown() {
    this.setState({
      dropdownVisible: !this.state.dropdownVisible
    });
  },

  render() {
    return (
      <div>
        { this.state.dropdownVisible ? this.renderDropdown() : this.renderReadView() }
      </div>
    );
  }
});

var YearDropdownOptions = React.createClass({
  mixins: [OnClickOutside],

  propTypes: {
    year: React.PropTypes.number.isRequired,
    onChange: React.PropTypes.func.isRequired,
    onCancel: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      yearsList: generateYears(this.props.year)
    };
  },

  render() {
    return (
      <div className="datepicker__year-dropdown">
        {this.renderOptions()}
      </div>
    );
  },

  renderOptions() {
    var selectedYear = this.props.year;
    var options = this.state.yearsList.map(year =>
      <div className="datepicker__year-option"
        key={year}
        onClick={this.onChange.bind(this, year)}>
        { selectedYear === year ? <span className="datepicker__year-option--selected">✓</span> : "" }
        { year }
      </div>
    );

    options.unshift(
      <div className="datepicker__year-option"
        ref={"upcoming"}
        key={"upcoming"}
        onClick={this.incrementYears}>
        <a className="datepicker__navigation datepicker__navigation--years datepicker__navigation--years-upcoming"></a>
      </div>
    );
    options.push(
      <div className="datepicker__year-option"
        ref={"previous"}
        key={"previous"}
        onClick={this.decrementYears}>
        <a className="datepicker__navigation datepicker__navigation--years datepicker__navigation--years-previous"></a>
      </div>
    );
    return options;
  },

  onChange(year) {
    this.props.onChange(year);
  },

  handleClickOutside() {
    this.props.onCancel();
  },

  shiftYears(amount) {
    var years = this.state.yearsList.map(function(year) {
      return year + amount;
    });

    this.setState({
      yearsList: years
    });
  },

  incrementYears() {
    return this.shiftYears(1);
  },

  decrementYears() {
    return this.shiftYears(-1);
  }
});

window.DatePicker = React.createClass({

  propTypes: {
    selected: React.PropTypes.object,
    locale: React.PropTypes.string,
    dateFormatCalendar: React.PropTypes.string,
    disabled: React.PropTypes.bool,
    id: React.PropTypes.string,
    popoverAttachment: React.PropTypes.string,
    popoverTargetAttachment: React.PropTypes.string,
    popoverTargetOffset: React.PropTypes.string,
    tetherConstraints: React.PropTypes.array,
    showYearDropdown: React.PropTypes.bool,
    onChange: React.PropTypes.func.isRequired,
    onBlur: React.PropTypes.func,
    onFocus: React.PropTypes.func,
    tabIndex: React.PropTypes.number,
    filterDate: React.PropTypes.func,
    todayButton: React.PropTypes.string
  },

  getDefaultProps() {
    return {
      dateFormatCalendar: "MMMM YYYY",
      onChange() {},
      disabled: false,
      onFocus() {},
      onBlur() {},
      popoverAttachment: "top left",
      popoverTargetAttachment: "bottom left",
      popoverTargetOffset: "10px 0",
      tetherConstraints: [
        {
          to: "window",
          attachment: "together"
        }
      ]
    };
  },

  getInitialState() {
    return {
      open: false
    };
  },

  setOpen(open) {
    this.setState({ open });
  },

  handleFocus(event) {
    this.props.onFocus(event);
    this.setOpen(true);
  },

  handleBlur(event) {
    if (this.state.open) {
      this.refs.input.focus();
    } else {
      this.props.onBlur(event);
    }
  },

  handleCalendarClickOutside(event) {
    this.setOpen(false);
  },

  handleSelect(date) {
    this.setSelected(date);
    this.setOpen(false);
  },

  setSelected(date) {
    if (!isSameDay(this.props.selected, date)) {
      this.props.onChange(date);
    }
  },

  onInputClick() {
    this.setOpen(true);
  },

  handleInputDone() {
    this.setOpen(false);
  },

  onClearClick(event) {
    event.preventDefault();
    this.props.onChange(null);
  },

  renderCalendar() {
    if (!this.state.open || this.props.disabled) {
      return null;
    }
    return <Calendar
      ref="calendar"
      locale={this.props.locale}
      dateFormat={this.props.dateFormatCalendar}
      selected={this.props.selected}
      onSelect={this.handleSelect}
      minDate={this.props.minDate}
      maxDate={this.props.maxDate}
      startDate={this.props.startDate}
      endDate={this.props.endDate}
      excludeDates={this.props.excludeDates}
      filterDate={this.props.filterDate}
      onClickOutside={this.handleCalendarClickOutside}
      includeDates={this.props.includeDates}
      showYearDropdown={this.props.showYearDropdown}
      todayButton={this.props.todayButton} />;
  },

  renderClearButton() {
    if (this.props.isClearable && this.props.selected != null) {
      return <a className="close-icon" href="#" onClick={this.onClearClick}></a>;
    } else {
      return null;
    }
  },

  render() {
    return (
      <TetherComponent
        classPrefix={"datepicker__tether"}
        attachment={this.props.popoverAttachment}
        targetAttachment={this.props.popoverTargetAttachment}
        targetOffset={this.props.popoverTargetOffset}
        constraints={this.props.tetherConstraints}>
        <div className="datepicker__input-container">
          <DateInput
            ref="input"
            id={this.props.id}
            name={this.props.name}
            date={this.props.selected}
            locale={this.props.locale}
            minDate={this.props.minDate}
            maxDate={this.props.maxDate}
            excludeDates={this.props.excludeDates}
            includeDates={this.props.includeDates}
            filterDate={this.props.filterDate}
            dateFormat={this.props.dateFormat}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            handleClick={this.onInputClick}
            handleDone={this.handleInputDone}
            setSelected={this.setSelected}
            placeholderText={this.props.placeholderText}
            disabled={this.props.disabled}
            className={this.props.className}
            title={this.props.title}
            readOnly={this.props.readOnly}
            required={this.props.required}
            tabIndex={this.props.tabIndex}
            open={this.state.open} />
          {this.renderClearButton()}
        </div>
        {this.renderCalendar()}
      </TetherComponent>
    );
  }
});


function isSameDay(moment1, moment2) {
  if (moment1 && moment2) {
    return moment1.isSame(moment2, "day");
  } else {
    return !moment1 && !moment2;
  }
}

function isDayDisabled(day, { minDate, maxDate, excludeDates, includeDates, filterDate } = {}) {
  return (minDate && day.isBefore(minDate, "day")) ||
    (maxDate && day.isAfter(maxDate, "day")) ||
    (excludeDates && excludeDates.some(excludeDate => isSameDay(day, excludeDate))) ||
    (includeDates && !includeDates.some(includeDate => isSameDay(day, includeDate))) ||
    (filterDate && !filterDate(day.clone())) ||
    false;
}

function generateYears(year) {
  var list = [];
  for (var i = 0; i < 5; i++) {
    list.push(year - i);
  }
  return list;
}