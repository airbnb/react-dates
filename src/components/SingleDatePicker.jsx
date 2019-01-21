import React from 'react';
import moment from 'moment';
import { css, withStyles, withStylesPropTypes } from 'react-with-styles';
import { Portal } from 'react-portal';
import { forbidExtraProps } from 'airbnb-prop-types';
import { addEventListener } from 'consolidated-events';
import isTouchDevice from 'is-touch-device';
import OutsideClickHandler from 'react-outside-click-handler';

import SingleDatePickerShape from '../shapes/SingleDatePickerShape';
import { SingleDatePickerPhrases } from '../defaultPhrases';

import getResponsiveContainerStyles from '../utils/getResponsiveContainerStyles';
import getDetachedContainerStyles from '../utils/getDetachedContainerStyles';
import getInputHeight from '../utils/getInputHeight';
import isInclusivelyAfterDay from '../utils/isInclusivelyAfterDay';
import disableScroll from '../utils/disableScroll';
import noflip from '../utils/noflip';

import SingleDatePickerInputController from './SingleDatePickerInputController';
import DayPickerSingleDateController from './DayPickerSingleDateController';
import CloseButton from './CloseButton';

import {
  HORIZONTAL_ORIENTATION,
  VERTICAL_ORIENTATION,
  ANCHOR_LEFT,
  ANCHOR_RIGHT,
  OPEN_DOWN,
  OPEN_UP,
  DAY_SIZE,
  ICON_BEFORE_POSITION,
  INFO_POSITION_BOTTOM,
  FANG_HEIGHT_PX,
  DEFAULT_VERTICAL_SPACING,
} from '../constants';

const propTypes = forbidExtraProps({
  ...withStylesPropTypes,
  ...SingleDatePickerShape,
});

const defaultProps = {
  // required props for a functional interactive SingleDatePicker
  date: null,
  focused: false,

  // input related props
  id: 'date',
  placeholder: 'Date',
  disabled: false,
  required: false,
  readOnly: false,
  screenReaderInputMessage: '',
  showClearDate: false,
  showDefaultInputIcon: false,
  inputIconPosition: ICON_BEFORE_POSITION,
  customInputIcon: null,
  customCloseIcon: null,
  noBorder: false,
  block: false,
  small: false,
  regular: false,
  verticalSpacing: DEFAULT_VERTICAL_SPACING,
  keepFocusOnInput: false,

  // calendar presentation and interaction related props
  orientation: HORIZONTAL_ORIENTATION,
  anchorDirection: ANCHOR_LEFT,
  openDirection: OPEN_DOWN,
  horizontalMargin: 0,
  withPortal: false,
  withFullScreenPortal: false,
  appendToBody: false,
  disableScroll: false,
  initialVisibleMonth: null,
  firstDayOfWeek: null,
  numberOfMonths: 2,
  keepOpenOnDateSelect: false,
  reopenPickerOnClearDate: false,
  renderCalendarInfo: null,
  calendarInfoPosition: INFO_POSITION_BOTTOM,
  hideKeyboardShortcutsPanel: false,
  daySize: DAY_SIZE,
  isRTL: false,
  verticalHeight: null,
  transitionDuration: undefined,
  horizontalMonthPadding: 13,

  // navigation related props
  navPrev: null,
  navNext: null,

  onPrevMonthClick() {},
  onNextMonthClick() {},
  onClose() {},

  // month presentation and interaction related props
  renderMonthText: null,

  // day presentation and interaction related props
  renderCalendarDay: undefined,
  renderDayContents: null,
  renderMonthElement: null,
  enableOutsideDays: false,
  isDayBlocked: () => false,
  isOutsideRange: day => !isInclusivelyAfterDay(day, moment()),
  isDayHighlighted: () => {},

  // internationalization props
  displayFormat: () => moment.localeData().longDateFormat('L'),
  monthFormat: 'MMMM YYYY',
  weekDayFormat: 'dd',
  phrases: SingleDatePickerPhrases,
  dayAriaLabelFormat: undefined,
};

class SingleDatePicker extends React.PureComponent {
  constructor(props) {
    super(props);

    this.isTouchDevice = false;

    this.state = {
      dayPickerContainerStyles: {},
      isDayPickerFocused: false,
      isInputFocused: false,
      showKeyboardShortcuts: false,
    };

    this.onOutsideClick = this.onOutsideClick.bind(this);
    this.onInputFocus = this.onInputFocus.bind(this);
    this.onDayPickerFocus = this.onDayPickerFocus.bind(this);
    this.onDayPickerBlur = this.onDayPickerBlur.bind(this);
    this.showKeyboardShortcutsPanel = this.showKeyboardShortcutsPanel.bind(this);

    this.responsivizePickerPosition = this.responsivizePickerPosition.bind(this);
    this.disableScroll = this.disableScroll.bind(this);

    this.setDayPickerContainerRef = this.setDayPickerContainerRef.bind(this);
    this.setContainerRef = this.setContainerRef.bind(this);
  }

  /* istanbul ignore next */
  componentDidMount() {
    this.removeEventListener = addEventListener(
      window,
      'resize',
      this.responsivizePickerPosition,
      { passive: true },
    );
    this.responsivizePickerPosition();
    this.disableScroll();

    const { focused } = this.props;

    if (focused) {
      this.setState({
        isInputFocused: true,
      });
    }

    this.isTouchDevice = isTouchDevice();
  }

  componentDidUpdate(prevProps) {
    const { focused } = this.props;
    if (!prevProps.focused && focused) {
      this.responsivizePickerPosition();
      this.disableScroll();
    } else if (prevProps.focused && !focused) {
      if (this.enableScroll) this.enableScroll();
    }
  }

  /* istanbul ignore next */
  componentWillUnmount() {
    if (this.removeEventListener) this.removeEventListener();
    if (this.enableScroll) this.enableScroll();
  }

  onOutsideClick(event) {
    const {
      focused,
      onFocusChange,
      onClose,
      startDate,
      endDate,
      appendToBody,
    } = this.props;
    if (!focused) return;
    if (appendToBody && this.dayPickerContainer.contains(event.target)) return;

    this.setState({
      isInputFocused: false,
      isDayPickerFocused: false,
      showKeyboardShortcuts: false,
    });

    onFocusChange({ focused: false });
    onClose({ startDate, endDate });
  }

  onInputFocus({ focused }) {
    const {
      onFocusChange,
      readOnly,
      withPortal,
      withFullScreenPortal,
      keepFocusOnInput,
    } = this.props;

    if (focused) {
      const withAnyPortal = withPortal || withFullScreenPortal;
      const moveFocusToDayPicker = withAnyPortal
        || (readOnly && !keepFocusOnInput)
        || (this.isTouchDevice && !keepFocusOnInput);

      if (moveFocusToDayPicker) {
        this.onDayPickerFocus();
      } else {
        this.onDayPickerBlur();
      }
    }

    onFocusChange({ focused });
  }

  onDayPickerFocus() {
    this.setState({
      isInputFocused: false,
      isDayPickerFocused: true,
      showKeyboardShortcuts: false,
    });
  }

  onDayPickerBlur() {
    this.setState({
      isInputFocused: true,
      isDayPickerFocused: false,
      showKeyboardShortcuts: false,
    });
  }

  setDayPickerContainerRef(ref) {
    this.dayPickerContainer = ref;
  }

  setContainerRef(ref) {
    this.container = ref;
  }

  disableScroll() {
    const { appendToBody, disableScroll: propDisableScroll, focused } = this.props;
    if (!appendToBody && !propDisableScroll) return;
    if (!focused) return;

    // Disable scroll for every ancestor of this <SingleDatePicker> up to the
    // document level. This ensures the input and the picker never move. Other
    // sibling elements or the picker itself can scroll.
    this.enableScroll = disableScroll(this.container);
  }

  /* istanbul ignore next */
  responsivizePickerPosition() {
    // It's possible the portal props have been changed in response to window resizes
    // So let's ensure we reset this back to the base state each time
    this.setState({ dayPickerContainerStyles: {} });

    const {
      openDirection,
      anchorDirection,
      horizontalMargin,
      withPortal,
      withFullScreenPortal,
      appendToBody,
      focused,
    } = this.props;
    const { dayPickerContainerStyles } = this.state;

    if (!focused) {
      return;
    }

    const isAnchoredLeft = anchorDirection === ANCHOR_LEFT;

    if (!withPortal && !withFullScreenPortal) {
      const containerRect = this.dayPickerContainer.getBoundingClientRect();
      const currentOffset = dayPickerContainerStyles[anchorDirection] || 0;
      const containerEdge = isAnchoredLeft
        ? containerRect[ANCHOR_RIGHT]
        : containerRect[ANCHOR_LEFT];

      this.setState({
        dayPickerContainerStyles: {
          ...getResponsiveContainerStyles(
            anchorDirection,
            currentOffset,
            containerEdge,
            horizontalMargin,
          ),
          ...(appendToBody && getDetachedContainerStyles(
            openDirection,
            anchorDirection,
            this.container,
          )),
        },
      });
    }
  }

  showKeyboardShortcutsPanel() {
    this.setState({
      isInputFocused: false,
      isDayPickerFocused: true,
      showKeyboardShortcuts: true,
    });
  }

  maybeRenderDayPickerWithPortal() {
    const {
      focused,
      withPortal,
      withFullScreenPortal,
      appendToBody,
    } = this.props;

    if (!focused) {
      return null;
    }

    if (withPortal || withFullScreenPortal || appendToBody) {
      return (
        <Portal>
          {this.renderDayPicker()}
        </Portal>
      );
    }

    return this.renderDayPicker();
  }

  renderDayPicker() {
    const {
      anchorDirection,
      openDirection,
      onDateChange,
      date,
      onFocusChange,
      focused,
      enableOutsideDays,
      numberOfMonths,
      orientation,
      monthFormat,
      navPrev,
      navNext,
      onPrevMonthClick,
      onNextMonthClick,
      onClose,
      withPortal,
      withFullScreenPortal,
      keepOpenOnDateSelect,
      initialVisibleMonth,
      renderMonthText,
      renderCalendarDay,
      renderDayContents,
      renderCalendarInfo,
      renderMonthElement,
      calendarInfoPosition,
      hideKeyboardShortcutsPanel,
      firstDayOfWeek,
      customCloseIcon,
      phrases,
      dayAriaLabelFormat,
      daySize,
      isRTL,
      isOutsideRange,
      isDayBlocked,
      isDayHighlighted,
      weekDayFormat,
      styles,
      verticalHeight,
      transitionDuration,
      verticalSpacing,
      horizontalMonthPadding,
      small,
      theme: { reactDates },
    } = this.props;
    const { dayPickerContainerStyles, isDayPickerFocused, showKeyboardShortcuts } = this.state;

    const onOutsideClick = (!withFullScreenPortal && withPortal) ? this.onOutsideClick : undefined;
    const closeIcon = customCloseIcon || (<CloseButton />);

    const inputHeight = getInputHeight(reactDates, small);

    const withAnyPortal = withPortal || withFullScreenPortal;

    return (
      <div // eslint-disable-line jsx-a11y/no-static-element-interactions
        ref={this.setDayPickerContainerRef}
        {...css(
          styles.SingleDatePicker_picker,
          anchorDirection === ANCHOR_LEFT && styles.SingleDatePicker_picker__directionLeft,
          anchorDirection === ANCHOR_RIGHT && styles.SingleDatePicker_picker__directionRight,
          openDirection === OPEN_DOWN && styles.SingleDatePicker_picker__openDown,
          openDirection === OPEN_UP && styles.SingleDatePicker_picker__openUp,
          !withAnyPortal && openDirection === OPEN_DOWN && {
            top: inputHeight + verticalSpacing,
          },
          !withAnyPortal && openDirection === OPEN_UP && {
            bottom: inputHeight + verticalSpacing,
          },
          orientation === HORIZONTAL_ORIENTATION && styles.SingleDatePicker_picker__horizontal,
          orientation === VERTICAL_ORIENTATION && styles.SingleDatePicker_picker__vertical,
          withAnyPortal && styles.SingleDatePicker_picker__portal,
          withFullScreenPortal && styles.SingleDatePicker_picker__fullScreenPortal,
          isRTL && styles.SingleDatePicker_picker__rtl,
          dayPickerContainerStyles,
        )}
        onClick={onOutsideClick}
      >
        <DayPickerSingleDateController
          date={date}
          onDateChange={onDateChange}
          onFocusChange={onFocusChange}
          orientation={orientation}
          enableOutsideDays={enableOutsideDays}
          numberOfMonths={numberOfMonths}
          monthFormat={monthFormat}
          withPortal={withAnyPortal}
          focused={focused}
          keepOpenOnDateSelect={keepOpenOnDateSelect}
          hideKeyboardShortcutsPanel={hideKeyboardShortcutsPanel}
          initialVisibleMonth={initialVisibleMonth}
          navPrev={navPrev}
          navNext={navNext}
          onPrevMonthClick={onPrevMonthClick}
          onNextMonthClick={onNextMonthClick}
          onClose={onClose}
          renderMonthText={renderMonthText}
          renderCalendarDay={renderCalendarDay}
          renderDayContents={renderDayContents}
          renderCalendarInfo={renderCalendarInfo}
          renderMonthElement={renderMonthElement}
          calendarInfoPosition={calendarInfoPosition}
          isFocused={isDayPickerFocused}
          showKeyboardShortcuts={showKeyboardShortcuts}
          onBlur={this.onDayPickerBlur}
          phrases={phrases}
          dayAriaLabelFormat={dayAriaLabelFormat}
          daySize={daySize}
          isRTL={isRTL}
          isOutsideRange={isOutsideRange}
          isDayBlocked={isDayBlocked}
          isDayHighlighted={isDayHighlighted}
          firstDayOfWeek={firstDayOfWeek}
          weekDayFormat={weekDayFormat}
          verticalHeight={verticalHeight}
          transitionDuration={transitionDuration}
          horizontalMonthPadding={horizontalMonthPadding}
        />

        {withFullScreenPortal && (
          <button
            {...css(styles.SingleDatePicker_closeButton)}
            aria-label={phrases.closeDatePicker}
            type="button"
            onClick={this.onOutsideClick}
          >
            <div {...css(styles.SingleDatePicker_closeButton_svg)}>
              {closeIcon}
            </div>
          </button>
        )}
      </div>
    );
  }

  render() {
    const {
      id,
      placeholder,
      disabled,
      focused,
      required,
      readOnly,
      openDirection,
      showClearDate,
      showDefaultInputIcon,
      inputIconPosition,
      customCloseIcon,
      customInputIcon,
      date,
      onDateChange,
      displayFormat,
      phrases,
      withPortal,
      withFullScreenPortal,
      screenReaderInputMessage,
      isRTL,
      noBorder,
      block,
      small,
      regular,
      verticalSpacing,
      reopenPickerOnClearDate,
      keepOpenOnDateSelect,
      styles,
      isOutsideRange,
    } = this.props;

    const { isInputFocused } = this.state;

    const enableOutsideClick = (!withPortal && !withFullScreenPortal);

    const hideFang = verticalSpacing < FANG_HEIGHT_PX;

    const input = (
      <SingleDatePickerInputController
        id={id}
        placeholder={placeholder}
        focused={focused}
        isFocused={isInputFocused}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        openDirection={openDirection}
        showCaret={!withPortal && !withFullScreenPortal && !hideFang}
        showClearDate={showClearDate}
        showDefaultInputIcon={showDefaultInputIcon}
        inputIconPosition={inputIconPosition}
        isOutsideRange={isOutsideRange}
        customCloseIcon={customCloseIcon}
        customInputIcon={customInputIcon}
        date={date}
        onDateChange={onDateChange}
        displayFormat={displayFormat}
        onFocusChange={this.onInputFocus}
        onKeyDownArrowDown={this.onDayPickerFocus}
        onKeyDownQuestionMark={this.showKeyboardShortcutsPanel}
        screenReaderMessage={screenReaderInputMessage}
        phrases={phrases}
        isRTL={isRTL}
        noBorder={noBorder}
        block={block}
        small={small}
        regular={regular}
        verticalSpacing={verticalSpacing}
        reopenPickerOnClearDate={reopenPickerOnClearDate}
        keepOpenOnDateSelect={keepOpenOnDateSelect}
      />
    );

    return (
      <div
        ref={this.setContainerRef}
        {...css(
          styles.SingleDatePicker,
          block && styles.SingleDatePicker__block,
        )}
      >
        {enableOutsideClick && (
          <OutsideClickHandler onOutsideClick={this.onOutsideClick}>
            {input}
            {this.maybeRenderDayPickerWithPortal()}
          </OutsideClickHandler>
        )}
        {!enableOutsideClick && input}
        {!enableOutsideClick && this.maybeRenderDayPickerWithPortal()}
      </div>
    );
  }
}

SingleDatePicker.propTypes = propTypes;
SingleDatePicker.defaultProps = defaultProps;

export { SingleDatePicker as PureSingleDatePicker };
export default withStyles(({ reactDates: { color, zIndex } }) => ({
  SingleDatePicker: {
    position: 'relative',
    display: 'inline-block',
  },

  SingleDatePicker__block: {
    display: 'block',
  },

  SingleDatePicker_picker: {
    zIndex: zIndex + 1,
    backgroundColor: color.background,
    position: 'absolute',
  },

  SingleDatePicker_picker__rtl: {
    direction: noflip('rtl'),
  },

  SingleDatePicker_picker__directionLeft: {
    left: noflip(0),
  },

  SingleDatePicker_picker__directionRight: {
    right: noflip(0),
  },

  SingleDatePicker_picker__portal: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    position: 'fixed',
    top: 0,
    left: noflip(0),
    height: '100%',
    width: '100%',
  },

  SingleDatePicker_picker__fullScreenPortal: {
    backgroundColor: color.background,
  },

  SingleDatePicker_closeButton: {
    background: 'none',
    border: 0,
    color: 'inherit',
    font: 'inherit',
    lineHeight: 'normal',
    overflow: 'visible',
    cursor: 'pointer',

    position: 'absolute',
    top: 0,
    right: noflip(0),
    padding: 15,
    zIndex: zIndex + 2,

    ':hover': {
      textDecoration: 'none',
    },

    ':focus': {
      textDecoration: 'none',
    },
  },

  SingleDatePicker_closeButton_svg: {
    height: 15,
    width: 15,
    fill: color.core.grayLighter,
  },
}), { pureComponent: typeof React.PureComponent !== 'undefined' })(SingleDatePicker);
