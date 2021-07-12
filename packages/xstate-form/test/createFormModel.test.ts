import { createMachine, interpret } from 'xstate';
import {
  ContextFromFormModel,
  createFormModel,
  EventsFromFormModel,
  ModelFromFormModel
} from '../src';

describe('createFormModel', () => {
  it('Should allow you to create a state and receive change events', () => {
    const model = createFormModel('loginForm', {
      initialValues: {
        username: '',
        password: ''
      },
      validate: ({ username, password }) => {
        if (!username) {
          return {
            username: 'You must provide a username'
          };
        }
        if (!password) {
          return {
            password: 'You must provide a password'
          };
        }
      }
    });

    const machine = createMachine<
      ContextFromFormModel<typeof model>,
      EventsFromFormModel<typeof model>
    >({
      initial: 'gettingData',
      context: {
        loginForm: model.initialContext
      },
      states: {
        gettingData: model.createState({})
      }
    });

    const service = interpret(machine).start();

    expect(service.state.context.loginForm.values).toEqual({
      username: '',
      password: ''
    });

    service.send(model.events.change('username', 'something'));
    expect(service.state.context.loginForm.values).toEqual({
      username: 'something',
      password: ''
    });
  });

  it('Should allow you to calculate whether the form is valid or not', () => {
    const model = createFormModel('loginForm', {
      initialValues: {
        username: '',
        password: ''
      },
      validate: ({ username, password }) => {
        if (!username) {
          return {
            username: 'You must provide a username'
          };
        }
        if (!password) {
          return {
            password: 'You must provide a password'
          };
        }
      }
    });

    const machine = createMachine({
      initial: 'gettingData',
      context: {
        loginForm: model.initialContext
      },
      states: {
        gettingData: model.createState({})
      }
    });

    const service = interpret(machine).start();

    expect(model.selectors.getIsValid(service.state.context)).toEqual(false);
    expect(service.state.context.loginForm.errors).toEqual({
      username: 'You must provide a username'
    });

    service.send(model.events.change('username', 'something'));
    expect(service.state.context.loginForm.errors).toEqual({
      password: 'You must provide a password'
    });

    service.send(model.events.change('password', 'pass'));
    expect(service.state.context.loginForm.errors).toEqual({});
    expect(model.selectors.getIsValid(service.state.context)).toEqual(true);
  });

  it('Should allow you to override the change function', () => {
    const model = createFormModel('loginForm', {
      initialValues: {
        username: '',
        password: ''
      }
    });

    const action = jest.fn();

    const machine = createMachine<
      ContextFromFormModel<typeof model>,
      EventsFromFormModel<typeof model>
    >({
      initial: 'gettingData',
      context: {
        loginForm: model.initialContext
      },
      states: {
        gettingData: model.createState({
          on: {
            'loginForm.CHANGE': {
              actions: (context, event) => action()
            }
          }
        })
      }
    });

    const service = interpret(machine).start();

    service.send({
      type: 'loginForm.CHANGE',
      name: 'username',
      value: 'username'
    });

    expect(service.state.context.loginForm.values).toEqual({
      username: '',
      password: ''
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  describe('Focus events', () => {
    it('Should allow you to track a focus event', () => {
      const model = createFormModel('loginForm', {
        initialValues: {
          username: ''
        }
      });

      const machine = createMachine<
        ContextFromFormModel<typeof model>,
        EventsFromFormModel<typeof model>
      >({
        initial: 'gettingData',
        context: {
          loginForm: model.initialContext
        },
        states: {
          gettingData: model.createState({})
        }
      });

      const service = interpret(machine).start();

      service.send({
        type: 'loginForm.FOCUS',
        name: 'username'
      });

      expect(service.state.context.loginForm.touched).toEqual({
        username: true
      });

      expect(model.selectors.getIsDirty(service.state.context)).toEqual(true);
      expect(model.selectors.getIsPristine(service.state.context)).toEqual(
        false
      );
    });
  });
});
