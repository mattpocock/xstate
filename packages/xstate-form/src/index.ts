import { AssignAction, EventObject, StateNodeConfig, assign } from 'xstate';
import { Model } from 'xstate/src/model';

export interface FormModelParams<Values> {
  initialValues: Values;
  validate?: ValidateFunction<Values>;
}

export type ValidateFunction<Values> = (
  value: Values
) => ErrorsFromValues<Values> | void;

export type ErrorsFromValues<Values> = {
  [K in keyof Values]?: string;
};

export type BooleanMap<Values> = {
  [K in keyof Values]: boolean;
};

export interface InitialState<Values> {
  errors: ErrorsFromValues<Values>;
  touched: BooleanMap<Values>;
  values: Values;
}

const toInitialBooleanMap = <Values extends {}>(
  values: Values
): BooleanMap<Values> => {
  const map = {} as BooleanMap<Values>;
  Object.keys(values).forEach((key) => {
    map[key] = false;
  });
  return map;
};

export const makeInitialStateFromConfig = <Values extends {}>(
  config: FormModelParams<Values>
): InitialState<Values> => {
  return {
    values: config.initialValues,
    errors: config.validate?.(config.initialValues) || {},
    touched: toInitialBooleanMap(config.initialValues)
  };
};

export type FormContext<Key extends string, Values> = {
  [K in Key]: InitialState<Values>;
};

export interface FormModelSelectors<Key extends string, Values> {
  getIsValid: <TContext extends FormContext<Key, Values>>(
    context: TContext
  ) => boolean;
  getIsDirty: <TContext extends FormContext<Key, Values>>(
    context: TContext
  ) => boolean;
  getIsPristine: <TContext extends FormContext<Key, Values>>(
    context: TContext
  ) => boolean;
}

export interface FormModelEvents<Key extends string, Values> {
  change: <ValueName extends keyof Values>(
    name: ValueName,
    value: Values[ValueName]
  ) => {
    type: `${Key}.CHANGE`;
    name: ValueName;
    value: Values[ValueName];
  };
  blur: <ValueName extends keyof Values>(
    name: ValueName,
    value: Values[ValueName]
  ) => {
    type: `${Key}.BLUR`;
    name: ValueName;
    value: Values[ValueName];
  };
  focus: <ValueName extends keyof Values>(
    name: ValueName
  ) => {
    type: `${Key}.FOCUS`;
    name: ValueName;
  };
  submit: (
    values: Values
  ) => {
    type: `${Key}.SUBMIT`;
    values;
  };
}

export interface FormModelActions<Key extends string, Values> {
  assignChangeToState: AssignAction<FormContext<Key, Values>, any>;
  assignBlurToState: AssignAction<FormContext<Key, Values>, any>;
  assignFocusToState: AssignAction<FormContext<Key, Values>, any>;
}

export interface FormModel<Key extends string, Values> {
  key: Key;
  initialContext: InitialState<Values>;
  events: FormModelEvents<Key, Values>;
  createState: <
    TContext extends FormContext<Key, Values>,
    TEvent extends EventObject
  >(
    config: StateNodeConfig<TContext, any, TEvent>
  ) => StateNodeConfig<TContext, any, TEvent>;
  selectors: FormModelSelectors<Key, Values>;
}

export type FormEvents<Key extends string, Values> = {
  [K in keyof FormModelEvents<Key, Values>]: ReturnType<
    FormModelEvents<Key, Values>[K]
  >;
}[keyof FormModelEvents<Key, Values>];

export type EventsFromFormModel<T> = T extends FormModel<
  infer Key,
  infer Values
>
  ? FormEvents<Key, Values>
  : never;

export type ContextFromFormModel<T> = T extends FormModel<
  infer Key,
  infer Values
>
  ? FormContext<Key, Values>
  : never;

export type ModelFromFormModel<T> = T extends FormModel<infer Key, infer Values>
  ? Model<FormContext<Key, Values>, FormEvents<Key, Values>>
  : never;

export const createFormModel = <Key extends string, Values extends {}>(
  key: Key,
  config: FormModelParams<Values>
): FormModel<Key, Values> => {
  const events: FormModelEvents<Key, Values> = {
    change: (name, value) => {
      return {
        type: `${key}.CHANGE`,
        name,
        value
      };
    },
    blur: (name, value) => {
      return {
        type: `${key}.BLUR`,
        name,
        value
      };
    },
    focus: (name) => {
      return {
        type: `${key}.FOCUS`,
        name
      };
    },
    submit: (values) => {
      return {
        type: `${key}.SUBMIT`,
        values
      };
    }
  };

  const actions: FormModelActions<Key, Values> = {
    assignChangeToState: assign((context, event) => {
      const newValues: Values = {
        ...context[key].values,
        [event.name]: event.value
      };
      return {
        [key]: {
          ...context[key],
          values: newValues,
          errors: config.validate?.(newValues) || {}
        }
      } as FormContext<Key, Values>;
    }),
    assignBlurToState: assign((context, event) => {
      const newValues: Values = {
        ...context[key].values,
        [event.name]: event.value
      };

      return {
        [key]: {
          ...context[key],
          values: newValues,
          errors: config.validate?.(newValues) || {}
        }
      } as FormContext<Key, Values>;
    }),
    assignFocusToState: assign((context, event) => {
      return ({
        [key]: {
          ...context[key],
          touched: {
            ...context[key].touched,
            [event.name]: true
          }
        }
      } as unknown) as FormContext<Key, Values>;
    })
  };

  const createState = <
    TContext extends FormContext<Key, Values>,
    TEvent extends EventObject
  >(
    config: StateNodeConfig<TContext, any, TEvent>
  ): StateNodeConfig<TContext, any, TEvent> => {
    return {
      ...config,
      on: {
        [`${key}.CHANGE`]: {
          actions: [actions.assignChangeToState]
        },
        [`${key}.BLUR`]: {
          actions: [actions.assignBlurToState]
        },
        [`${key}.FOCUS`]: {
          actions: [actions.assignFocusToState]
        },
        ...config.on
      }
    };
  };

  const initialContext = makeInitialStateFromConfig(config);

  const getIsDirty: FormModelSelectors<Key, Values>['getIsDirty'] = (
    context
  ) => {
    return Object.values(context[key].touched).some(Boolean);
  };

  const selectors: FormModelSelectors<Key, Values> = {
    getIsValid: (context) => {
      return Object.keys(context[key].errors).length === 0;
    },
    getIsDirty,
    getIsPristine: (context) => !getIsDirty(context)
  };

  return {
    key,
    initialContext,
    events,
    createState,
    selectors
  };
};
