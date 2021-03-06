import React from 'react';
import { assert } from 'chai';
import { spy, useFakeTimers } from 'sinon';
import rerender from 'test/utils/rerender';
import {
  createShallow,
  createMount,
  describeConformance,
  getClasses,
  unwrap,
} from '@material-ui/core/test-utils';
import TouchRipple from './TouchRipple';
import ButtonBase from './ButtonBase';
import consoleErrorMock from 'test/utils/consoleErrorMock';
import * as PropTypes from 'prop-types';

const ButtonBaseNaked = unwrap(ButtonBase);

function focusVisible(element) {
  element.ownerDocument.dispatchEvent(new window.Event('keydown'));
  element.focus();
}

function simulatePointerDevice() {
  // first focus on a page triggers focus visible until a pointer event
  // has been dispatched
  document.dispatchEvent(new window.Event('pointerdown'));
}

describe('<ButtonBase />', () => {
  let mount;
  let shallow;
  let classes;

  before(() => {
    shallow = createShallow({ dive: true, disableLifecycleMethods: true });
    // StrictModeViolation: uses TouchRipple
    mount = createMount({ strict: false });
    classes = getClasses(<ButtonBase />);
  });

  after(() => {
    mount.cleanUp();
  });

  describeConformance(<ButtonBase />, () => ({
    classes,
    inheritComponent: 'button',
    mount,
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'a',
  }));

  describe('root node', () => {
    it('should change the button type', () => {
      const wrapper = mount(<ButtonBase type="submit">Hello</ButtonBase>);
      const button = wrapper.find('button');
      assert.strictEqual(button.exists(), true);
      assert.strictEqual(button.props().type, 'submit');
    });

    it('should change the button component and add accessibility requirements', () => {
      const wrapper = mount(<ButtonBase component="span" role="checkbox" aria-checked={false} />);
      const checkbox = wrapper.find('span[role="checkbox"]');
      assert.strictEqual(checkbox.props().tabIndex, 0);
    });

    it('should not apply role="button" if type="button"', () => {
      const wrapper = mount(<ButtonBase>Hello</ButtonBase>);
      const button = wrapper.find('button');
      assert.strictEqual(button.exists(), true);
      assert.strictEqual(wrapper.props().role, undefined);
    });

    it('should change the button type to span and set role="button"', () => {
      const wrapper = mount(<ButtonBase component="span">Hello</ButtonBase>);
      const button = wrapper.find('[role="button"]');
      assert.strictEqual(button.exists(), true);
      assert.strictEqual(button.type(), 'span');
      assert.strictEqual(button.props().type, undefined);
    });

    it('should automatically change the button to an a element when href is provided', () => {
      const wrapper = mount(<ButtonBase href="http://google.com">Hello</ButtonBase>);
      const button = wrapper.find('[role="button"]');
      assert.strictEqual(button.type(), 'a');
      assert.strictEqual(button.props().href, 'http://google.com');
    });

    it('should change the button type to a and set role="button"', () => {
      const wrapper = mount(<ButtonBase component="a">Hello</ButtonBase>);
      const button = wrapper.find('[role="button"]');
      assert.strictEqual(button.exists(), true);
      assert.strictEqual(button.type(), 'a');
      assert.strictEqual(button.props().type, undefined);
    });

    it('should not change the button to an a element', () => {
      const wrapper = mount(
        <ButtonBase component="span" href="http://google.com">
          Hello
        </ButtonBase>,
      );
      const button = wrapper.find('[role="button"]');
      assert.strictEqual(button.name(), 'span');
      assert.strictEqual(button.props().href, 'http://google.com');
    });
  });

  describe('event callbacks', () => {
    it('should fire event callbacks', () => {
      const events = [
        'onClick',
        'onFocus',
        'onBlur',
        'onKeyUp',
        'onKeyDown',
        'onMouseDown',
        'onMouseLeave',
        'onMouseUp',
        'onTouchEnd',
        'onTouchStart',
      ];

      const handlers = events.reduce((result, n) => {
        result[n] = spy();
        return result;
      }, {});

      const wrapper = shallow(<ButtonBase {...handlers} />);

      events.forEach(n => {
        const event = n.charAt(2).toLowerCase() + n.slice(3);
        wrapper.simulate(event, { persist: () => {} });
        assert.strictEqual(handlers[n].callCount, 1, `should have called the ${n} handler`);
      });
    });
  });

  describe('ripple', () => {
    let instanceWrapper;
    let wrapper;

    before(() => {
      wrapper = mount(<ButtonBase>Hello</ButtonBase>);
      instanceWrapper = wrapper.find('ButtonBase');
    });

    it('should be enabled by default', () => {
      const ripple = wrapper.find(TouchRipple);
      assert.strictEqual(ripple.length, 1);
    });

    it('should not have a focus ripple by default', () => {
      instanceWrapper.instance().ripple = { pulsate: spy() };
      instanceWrapper.setState({ focusVisible: true });

      assert.strictEqual(
        instanceWrapper.instance().ripple.pulsate.callCount,
        0,
        'should not call pulsate on the ripple',
      );
    });

    it('should start the ripple when the mouse is pressed 1', () => {
      instanceWrapper.instance().ripple = { start: spy() };
      wrapper.simulate('mouseDown', {});

      assert.strictEqual(instanceWrapper.instance().ripple.start.callCount, 1);
    });

    it('should stop the ripple when the mouse is released', () => {
      instanceWrapper.instance().ripple = { stop: spy() };
      wrapper.simulate('mouseUp', {});

      assert.strictEqual(instanceWrapper.instance().ripple.stop.callCount, 1);
    });

    it('should start the ripple when the mouse is pressed 2', () => {
      instanceWrapper.instance().ripple = { start: spy() };
      wrapper.simulate('mouseDown', {});

      assert.strictEqual(instanceWrapper.instance().ripple.start.callCount, 1);
    });

    it('should stop the ripple when the button blurs', () => {
      instanceWrapper.instance().ripple = { stop: spy() };
      wrapper.simulate('blur', {});

      assert.strictEqual(instanceWrapper.instance().ripple.stop.callCount, 1);
    });

    it('should start the ripple when the mouse is pressed 3', () => {
      instanceWrapper.instance().ripple = { start: spy() };
      wrapper.simulate('mouseDown', {});

      assert.strictEqual(instanceWrapper.instance().ripple.start.callCount, 1);
    });

    it('should stop the ripple when the mouse leaves', () => {
      instanceWrapper.instance().ripple = { stop: spy() };
      wrapper.simulate('mouseLeave', {});

      assert.strictEqual(instanceWrapper.instance().ripple.stop.callCount, 1);
    });

    it('should center the ripple', () => {
      assert.strictEqual(wrapper.find(TouchRipple).props().center, false);
      wrapper.setProps({ centerRipple: true });
      assert.strictEqual(wrapper.find(TouchRipple).props().center, true);
    });
  });

  describe('focusRipple', () => {
    let instanceWrapper;
    let wrapper;

    before(() => {
      wrapper = mount(<ButtonBase focusRipple>Hello</ButtonBase>);
      instanceWrapper = wrapper.find('ButtonBase');
    });

    it('should be enabled by default', () => {
      const ripple = wrapper.find(TouchRipple);
      assert.strictEqual(ripple.length, 1);
    });

    it('should pulsate the ripple when focusVisible', () => {
      instanceWrapper.instance().ripple = { pulsate: spy() };
      instanceWrapper.setState({ focusVisible: true });

      assert.strictEqual(instanceWrapper.instance().ripple.pulsate.callCount, 1);
    });

    it('should not stop the ripple when the mouse leaves', () => {
      instanceWrapper.instance().ripple = { stop: spy() };
      wrapper.simulate('mouseLeave', {
        defaultPrevented: false,
        preventDefault() {
          this.defaultPrevented = true;
        },
      });

      assert.strictEqual(instanceWrapper.instance().ripple.stop.callCount, 0);
    });

    it('should stop pulsate and start a ripple when the space button is pressed', () => {
      instanceWrapper.instance().ripple = { stop: spy((event, cb) => cb()), start: spy() };
      instanceWrapper.simulate('keyDown', {
        key: ' ',
        persist: () => {},
      });

      assert.strictEqual(instanceWrapper.instance().ripple.stop.callCount, 1);
      assert.strictEqual(instanceWrapper.instance().ripple.start.callCount, 1);
    });

    it('should stop and re-pulsate when space bar is released', () => {
      instanceWrapper.instance().ripple = { stop: spy((event, cb) => cb()), pulsate: spy() };
      wrapper.simulate('keyUp', {
        key: ' ',
        persist: () => {},
      });

      assert.strictEqual(instanceWrapper.instance().ripple.stop.callCount, 1);
      assert.strictEqual(instanceWrapper.instance().ripple.pulsate.callCount, 1);
    });

    it('should stop on blur and set focusVisible to false', () => {
      instanceWrapper.instance().ripple = { stop: spy() };
      wrapper.simulate('blur', {});

      assert.strictEqual(instanceWrapper.instance().ripple.stop.callCount, 1);
      assert.strictEqual(wrapper.find('button').hasClass(classes.focusVisible), false);
    });
  });

  describe('mounted tab press listener', () => {
    let wrapper;
    let instance;
    let button;
    let clock;

    function getState() {
      /**
       * wrapper.find('ButtonBase').state()
       * throws '::state() can only be called on class components'
       */
      return instance.state;
    }

    beforeEach(() => {
      clock = useFakeTimers();
      wrapper = mount(
        <ButtonBase
          ref={element => {
            button = element;
          }}
        >
          Hello
        </ButtonBase>,
      );
      simulatePointerDevice();
      instance = wrapper.find('ButtonBase').instance();
      if (!button) {
        throw new Error('missing button');
      }
    });

    afterEach(() => {
      clock.restore();
    });

    it('should detect the keyboard', () => {
      assert.strictEqual(getState().focusVisible, false);
      focusVisible(button);
      assert.strictEqual(getState().focusVisible, true);
    });
  });

  describe('prop: disabled', () => {
    it('should not receive the focus', () => {
      const wrapper = mount(<ButtonBase disabled>Hello</ButtonBase>);
      assert.strictEqual(wrapper.find('button').props().tabIndex, -1);
    });

    it('should also apply it when using component', () => {
      const wrapper = mount(
        <ButtonBase disabled component="button">
          Hello
        </ButtonBase>,
      );
      assert.strictEqual(wrapper.find('button').props().disabled, true);
    });

    it('should reset the focused state', () => {
      const wrapper = mount(<ButtonBase>Hello</ButtonBase>);
      const instanceWrapper = wrapper.find('ButtonBase');
      // We simulate a focusVisible button that is getting disabled.
      instanceWrapper.setState({
        focusVisible: true,
      });
      wrapper.setProps({
        disabled: true,
      });
      assert.strictEqual(instanceWrapper.instance().state.focusVisible, false);
    });

    it('should not apply disabled on a span', () => {
      const wrapper = mount(
        <ButtonBase component="span" disabled>
          Hello
        </ButtonBase>,
      );
      assert.strictEqual(wrapper.find('span[role="button"]').props().disabled, undefined);
    });
  });

  describe('prop: component', () => {
    it('should allow to use a link component', () => {
      const Link = React.forwardRef((props, ref) => <div ref={ref} {...props} />);
      const wrapper = mount(<ButtonBase component={Link}>Hello</ButtonBase>);
      assert.strictEqual(
        wrapper
          .find('[role="button"]')
          .first()
          .type(),
        Link,
      );
    });
  });

  describe('handleFocus()', () => {
    let clock;

    before(() => {
      clock = useFakeTimers();
    });

    after(() => {
      clock.restore();
    });

    it('when disabled should not persist event', () => {
      const wrapper = mount(<ButtonBase disabled>Hello</ButtonBase>);
      const instance = wrapper.find('ButtonBase').instance();
      const eventMock = { persist: spy() };
      instance.handleFocus(eventMock);
      assert.strictEqual(eventMock.persist.callCount, 0);
    });

    it('onFocusVisibleHandler() should propagate call to onFocusVisible prop', () => {
      const onFocusVisibleSpy = spy();
      const buttonRef = React.createRef();
      mount(
        <ButtonBase component="span" onFocusVisible={onFocusVisibleSpy} ref={buttonRef}>
          Hello
        </ButtonBase>,
      );
      simulatePointerDevice();

      focusVisible(buttonRef.current);

      assert.strictEqual(onFocusVisibleSpy.callCount, 1);
      assert.strictEqual(onFocusVisibleSpy.firstCall.args.length, 1);
    });

    it('should work with a functional component', () => {
      const MyLink = React.forwardRef((props, ref) => {
        return (
          <a href="/foo" ref={ref} {...props}>
            bar
          </a>
        );
      });
      const wrapper = mount(
        <ButtonBase theme={{}} component={MyLink}>
          Hello
        </ButtonBase>,
      );
      const instance = wrapper.find('ButtonBase').instance();
      wrapper.simulate('focus');
      clock.tick(instance.focusVisibleCheckTime);
    });
  });

  describe('handleKeyDown()', () => {
    describe('avoids multiple keydown presses', () => {
      it('should work', () => {
        const wrapper = mount(
          <ButtonBase theme={{}} classes={{}} focusRipple>
            Hello
          </ButtonBase>,
        );
        const instanceWrapper = wrapper.find('ButtonBase');
        instanceWrapper.setState({ focusVisible: true });

        const eventPersistSpy = spy();
        const event = { persist: eventPersistSpy, key: ' ' };

        const instance = instanceWrapper.instance();
        instance.keyDown = false;
        instance.ripple = { stop: spy() };
        instance.handleKeyDown(event);
        assert.strictEqual(instance.keyDown, true);
        assert.strictEqual(event.persist.callCount, 1);
        assert.strictEqual(instance.ripple.stop.callCount, 1);
        assert.strictEqual(instance.ripple.stop.calledWith(event), true);
      });
    });

    describe('prop: onKeyDown', () => {
      it('should work', () => {
        const onKeyDownSpy = spy();
        const wrapper = mount(
          <ButtonBaseNaked theme={{}} classes={{}} onKeyDown={onKeyDownSpy}>
            Hello
          </ButtonBaseNaked>,
        );

        const eventPersistSpy = spy();
        const event = { persist: eventPersistSpy, key: undefined };

        const instance = wrapper.find('ButtonBase').instance();
        instance.keyDown = false;
        instance.handleKeyDown(event);

        assert.strictEqual(instance.keyDown, false);
        assert.strictEqual(event.persist.callCount, 0);
        assert.strictEqual(onKeyDownSpy.callCount, 1);
        assert.strictEqual(onKeyDownSpy.calledWith(event), true);
      });
    });

    describe('keyboard accessibility for non interactive elements', () => {
      it('should work', () => {
        const onClickSpy = spy();
        const wrapper = mount(
          <ButtonBaseNaked theme={{}} classes={{}} onClick={onClickSpy} component="div">
            Hello
          </ButtonBaseNaked>,
        );

        const event = {
          preventDefault: spy(),
          key: ' ',
          target: 'target',
          currentTarget: 'target',
        };

        const instance = wrapper.find('ButtonBase').instance();
        instance.keyDown = false;
        instance.handleKeyDown(event);

        assert.strictEqual(instance.keyDown, false);
        assert.strictEqual(event.preventDefault.callCount, 1);
        assert.strictEqual(onClickSpy.callCount, 1);
        assert.strictEqual(onClickSpy.calledWith(event), true);
      });

      it('should handle a link with no href', () => {
        const onClickSpy = spy();
        const wrapper = mount(
          <ButtonBaseNaked theme={{}} classes={{}} component="a" onClick={onClickSpy}>
            Hello
          </ButtonBaseNaked>,
        );
        const event = {
          preventDefault: spy(),
          key: 'Enter',
          target: 'target',
          currentTarget: 'target',
        };
        const instance = wrapper.find('ButtonBase').instance();
        instance.handleKeyDown(event);
        assert.strictEqual(event.preventDefault.callCount, 1);
        assert.strictEqual(onClickSpy.callCount, 1);
      });

      it('should ignore the link with href', () => {
        const onClickSpy = spy();
        const wrapper = mount(
          <ButtonBaseNaked theme={{}} classes={{}} component="a" href="href" onClick={onClickSpy}>
            Hello
          </ButtonBaseNaked>,
        );
        const event = {
          preventDefault: spy(),
          key: 'Enter',
          target: 'target',
          currentTarget: 'target',
        };
        const instance = wrapper.find('ButtonBase').instance();
        instance.handleKeyDown(event);
        assert.strictEqual(event.preventDefault.callCount, 0);
        assert.strictEqual(onClickSpy.callCount, 0);
      });
    });

    describe('prop: disableTouchRipple', () => {
      it('should work', () => {
        const wrapper = mount(
          <ButtonBase theme={{}} classes={{}} disableTouchRipple>
            Hello
          </ButtonBase>,
        );
        const instance = wrapper.find('ButtonBase').instance();
        assert.strictEqual(wrapper.find(TouchRipple).length, 1);
        instance.ripple = { start: spy(), stop: spy() };
        wrapper.simulate('mouseDown', {});
        assert.strictEqual(instance.ripple.start.callCount, 0);
        wrapper.simulate('mouseUp', {});
        assert.strictEqual(instance.ripple.stop.callCount, 0);
      });
    });

    describe('prop: disableRipple', () => {
      it('should work', () => {
        const wrapper = mount(
          <ButtonBase theme={{}} classes={{}}>
            Hello
          </ButtonBase>,
        );
        const instanceWrapper = wrapper.find('ButtonBase');

        assert.strictEqual(wrapper.find(TouchRipple).length, 1);
        const onKeyDownSpy = spy();
        wrapper.setProps({ onKeyDown: onKeyDownSpy, disableRipple: true, focusRipple: true });
        instanceWrapper.setState({ focusVisible: true });
        assert.strictEqual(wrapper.find(TouchRipple).length, 0);

        const eventPersistSpy = spy();
        const event = { persist: eventPersistSpy, key: ' ' };

        const instance = instanceWrapper.instance();
        instance.keyDown = false;
        instance.handleKeyDown(event);

        assert.strictEqual(instance.keyDown, false);
        assert.strictEqual(event.persist.callCount, 0);
        assert.strictEqual(onKeyDownSpy.callCount, 1);
        assert.strictEqual(onKeyDownSpy.calledWith(event), true);
      });
    });
  });

  describe('prop: action', () => {
    it('should be able to focus visible the button', () => {
      let buttonActions = {};
      const wrapper = mount(
        <ButtonBase
          theme={{}}
          classes={{}}
          action={actions => {
            buttonActions = actions;
          }}
          focusVisibleClassName="focusVisible"
        >
          Hello
        </ButtonBase>,
      );

      assert.strictEqual(typeof buttonActions.focusVisible, 'function');
      buttonActions.focusVisible();
      wrapper.update();
      assert.strictEqual(wrapper.find('button').getDOMNode(), document.activeElement);
      assert.strictEqual(wrapper.find('.focusVisible').exists(), true);
    });
  });

  describe('rerender', () => {
    beforeEach(() => {
      rerender.spy();
    });

    afterEach(() => {
      rerender.reset();
    });

    it('should not rerender the TouchRipple', () => {
      const wrapper = mount(<ButtonBase>foo</ButtonBase>);
      wrapper.setProps({
        children: 'bar',
      });

      assert.strictEqual(
        rerender.updates.filter(update => update.displayName !== 'NoSsr').length,
        3,
      );
    });
  });

  describe('warnings', () => {
    beforeEach(() => {
      consoleErrorMock.spy();
    });

    afterEach(() => {
      consoleErrorMock.reset();
      PropTypes.resetWarningCache();
    });

    it('throws with additional warnings on invalid `component` prop', () => {
      // Only run the test on node. On the browser the thrown error is not caught
      if (!/jsdom/.test(window.navigator.userAgent)) {
        return;
      }

      function Component(props) {
        return <button type="button" {...props} />;
      }

      // cant match the error message here because flakiness with mocha watchmode
      assert.throws(() => mount(<ButtonBase component={Component} />));

      assert.include(
        consoleErrorMock.args()[0][0],
        'Invalid prop `component` supplied to `ButtonBase`. Expected an element type that can hold a ref',
      );
      // first mount includes React warning that isn't logged on subsequent calls
      // in watchmode because it's cached
      const customErrorIndex = consoleErrorMock.callCount() === 3 ? 1 : 2;
      assert.include(
        consoleErrorMock.args()[customErrorIndex][0],
        'Error: Material-UI: expected an Element but found null. Please check your console for additional warnings and try fixing those.',
      );
    });
  });
});
