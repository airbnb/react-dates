import React from 'react';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon-sandbox';
import moment from 'moment';
import { describeIfWindow } from '../_helpers/describeIfWindow';

import CalendarMonth from '../../src/components/CalendarMonth';

const MAX_WAIT_TIME_IN_MS = 500;

export default function awaitChange(fn) {
  const startTimestamp = Date.now();

  return new Promise((resolve, reject) => {
    const checkAndWait = () => {
      try {
        fn();
        resolve();
      } catch (e) {
        if (Date.now() - startTimestamp > MAX_WAIT_TIME_IN_MS) {
          reject(e);
          return;
        }

        setTimeout(checkAndWait, 10);
      }
    };

    checkAndWait();
  });
}

describe('CalendarMonth', () => {
  describe('#render', () => {
    describe('data-visible attribute', () => {
      it('data-visible attribute is truthy if props.isVisible', () => {
        const wrapper = shallow(<CalendarMonth isVisible />).dive();
        expect(wrapper.prop('data-visible')).to.equal(true);
      });

      it('data-visible attribute is falsy if !props.isVisible', () => {
        const wrapper = shallow(<CalendarMonth isVisible={false} />).dive();
        expect(wrapper.prop('data-visible')).to.equal(false);
      });
    });

    describe('caption', () => {
      it('text is the correctly formatted month title', () => {
        const MONTH = moment();
        const captionWrapper = shallow(<CalendarMonth month={MONTH} />).dive().find('strong');
        expect(captionWrapper.text()).to.equal(MONTH.format('MMMM YYYY'));
      });
    });

    it('renderMonthElement renders month element when month changes', () => {
      const renderMonthElementStub = sinon.stub().returns(<div id="month-element" />);
      const wrapper = shallow(<CalendarMonth renderMonthElement={renderMonthElementStub} />).dive();
      wrapper.setProps({ month: moment().subtract(1, 'months') });

      const [{
        month,
        onMonthSelect,
        onYearSelect,
        isVisible,
      }] = renderMonthElementStub.getCall(0).args;

      expect(moment.isMoment(month)).to.equal(true);
      expect(typeof onMonthSelect).to.equal('function');
      expect(typeof onYearSelect).to.equal('function');
      expect(typeof isVisible).to.equal('boolean');
      expect(wrapper.find('#month-element').exists()).to.equal(true);
    });

    describeIfWindow('setMonthTitleHeight', () => {
      it('sets the title height after mount', () => {
        const setMonthTitleHeightStub = sinon.stub();
        mount(
          <CalendarMonth
            isVisible
            setMonthTitleHeight={setMonthTitleHeightStub}
          />,
        );

        return awaitChange(() => expect(setMonthTitleHeightStub.callCount).to.equal(1));
      });

      describe('if the callbacks gets set again', () => {
        it('updates the title height', () => {
          const setMonthTitleHeightStub = sinon.stub();
          const wrapper = mount(
            <CalendarMonth
              isVisible
              setMonthTitleHeight={setMonthTitleHeightStub}
            />,
          );

          return awaitChange(() => expect(setMonthTitleHeightStub.callCount).to.equal(1))
            .then(() => {
              wrapper.setProps({ setMonthTitleHeight: null });

              wrapper.setProps({ setMonthTitleHeight: setMonthTitleHeightStub });
              return awaitChange(() => expect(setMonthTitleHeightStub.callCount).to.equal(2));
            });
        });
      });
    });
  });
});
