import React from 'react';
import moment from 'moment';
import { storiesOf, action } from '@storybook/react';

import InfoPanelDecorator, { monospace } from './InfoPanelDecorator';

import isSameDay from '../src/utils/isSameDay';
import isInclusivelyAfterDay from '../src/utils/isInclusivelyAfterDay';

import { VERTICAL_ORIENTATION, VERTICAL_SCROLLABLE } from '../src/constants';

import DayPickerRangeControllerWrapper from '../examples/DayPickerRangeControllerWrapper';

import UIIcon from './../src/pacificComponents/icon.js'
import BackSVG from './../src/pacificComponents/back.js'

const dayPickerRangeControllerInfo = `The ${monospace('PacificRangePicker')} component`;

const TestPrevIcon = () => (
  <span
    style={{
      border: '1px solid #dce0e0',
      backgroundColor: '#fff',
      color: '#484848',
      padding: '3px',
    }}
  >
    Prev
  </span>
);

const TestNextIcon = () => (
  <span
    style={{
      border: '1px solid #dce0e0',
      backgroundColor: '#fff',
      color: '#484848',
      padding: '3px',
    }}
  >
    Next
  </span>
);

moment.updateLocale('en', {
  week: {
    dow: 0,
  },
  weekdaysMin: 'M_T_W_T_F_S_S'.split('_')
});

const { colors } = require('./../src/styles/vars')

const icon = (
  <UIIcon
    icon={(color) => (<BackSVG fill={color} />)}
    color={colors.colorN5}
    hoverColor={colors.colorBlack}
  />
);

const navPrevStyle = {
  position: 'absolute',
  top: '0',
  left: '12px',
}

const navPrev = (
  <div style={navPrevStyle}>
    {icon}
  </div>
)

const navNextStyle = {
  position: 'absolute',
  top: '0',
  right: '12px',
  transform: 'rotate(180deg)',
}

const navNext = (
  <div style={navNextStyle}>
    {icon}
  </div>
)

storiesOf('PacificRangePicker', module)
  .addDecorator(InfoPanelDecorator(dayPickerRangeControllerInfo))
  .addWithInfo('RangePicker', () => (
    <DayPickerRangeControllerWrapper
      onOutsideClick={action('DayPickerRangeController::onOutsideClick')}
      onPrevMonthClick={action('DayPickerRangeController::onPrevMonthClick')}
      onNextMonthClick={action('DayPickerRangeController::onNextMonthClick')}
      numberOfMonths={1}
      renderMonthText={(m) => m.format('MMMM, YYYY')}
      verticalBorderSpacing={4}
      navPrev={navPrev}
      navNext={navNext}
    />
));
