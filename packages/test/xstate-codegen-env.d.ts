/// <reference types="xstate" />
/// <reference types="@xstate/react" />

import {
  StateNodeWithGeneratedTypes,
  EventObject,
  MachineOptions,
  StateWithMatches,
  InterpreterWithMatches,
  StateMachineWithGeneratedTypes,
  StateSchema
} from 'xstate';
import { Interpreter } from 'xstate/lib/interpreter';
import { State } from 'xstate/lib/State';
import { GeneratedStateNode } from 'xstate/lib/StateNode';

declare module 'xstate' {
  /** Types imported via the TS Compiler API */
  interface LightMachineContext {
    elapsed: number;
  }

  type LightMachineEvent =
    | { type: 'TIMER' }
    | { type: 'POWER_OUTAGE' }
    | { type: 'PED_COUNTDOWN'; duration: number };

  type LightMachineStateMatches =
    | 'green'
    | 'yellow'
    | 'red'
    | 'red.walk'
    | 'red.wait'
    | 'red.stop';

  interface LightMachineOptions {
    context?: Partial<LightMachineContext>;
    guards: {
      hasCompleted: (
        context: LightMachineContext,
        event: Extract<LightMachineEvent, { type: 'PED_COUNTDOWN' }>
      ) => boolean;
    };
    devTools?: boolean;
  }

  interface LightMachineStateSchema {
    states: {
      green: {};
      yellow: {};
      red: {
        states: {
          walk: {};
          wait: {};
          stop: {};
        };
      };
    };
  }

  export class StateMachineWithGeneratedTypes<
    TContext,
    TStateSchema extends StateSchema,
    TEvent extends EventObject,
    TMatches,
    TOptions
  > extends StateNodeWithGeneratedTypes<
    TContext,
    TStateSchema,
    TEvent,
    TMatches,
    TOptions
  > {
    id: string;
    states: StateNodeWithGeneratedTypes<
      TContext,
      TStateSchema,
      TEvent,
      TMatches,
      TOptions
    >['states'];
    _isGenerated: true;
  }

  export class LightMachineStateMachine extends StateMachineWithGeneratedTypes<
    LightMachineContext,
    LightMachineStateSchema,
    LightMachineEvent,
    LightMachineStateMatches,
    LightMachineOptions
  > {}

  /** Utility types */

  export class StateNodeWithGeneratedTypes<
    TContext,
    TSchema,
    TEvent extends EventObject,
    TMatches,
    TOptions
  > extends GeneratedStateNode<TContext, TSchema, TEvent> {
    /**
     * A little hack to make sure that the TMatches and TOptions are stored
     * somewhere - there could be a better way of doing this
     */
    _options?: TOptions;
    _matches?: TMatches;
    _isGenerated: true;
  }

  export type InterpreterWithMatches<
    TContext,
    TSchema,
    TEvent extends EventObject,
    TMatches
  > = Omit<Interpreter<TContext, TSchema, TEvent>, 'state'> & {
    state: StateWithMatches<TContext, TEvent, TMatches>;
  };

  export type StateWithMatches<
    TContext,
    TEvent extends EventObject,
    TMatches
  > = Omit<State<TContext, TEvent>, 'matches'> & {
    matches: (matches: TMatches) => boolean;
  };

  /**
   * Interpret function for compiled state machines
   */
  export function interpret<
    TContext,
    TSchema,
    TEvent extends EventObject,
    TMatches,
    TOptions = MachineOptions<TContext, TEvent>
  >(
    machine: StateNodeWithGeneratedTypes<
      TContext,
      TSchema,
      TEvent,
      TMatches,
      TOptions
    >,
    options: TOptions
  ): InterpreterWithMatches<TContext, TSchema, TEvent, TMatches>;
}

declare module '@xstate/react' {
  export function useMachine<
    TContext,
    TSchema,
    TEvent extends EventObject,
    TMatches extends string,
    TOptions
  >(
    machine: StateMachineWithGeneratedTypes<
      TContext,
      TSchema,
      TEvent,
      TMatches,
      TOptions
    >,
    options: TOptions
  ): [
    StateWithMatches<TContext, TEvent, TMatches>,
    InterpreterWithMatches<TContext, TSchema, TEvent, TMatches>['send'],
    InterpreterWithMatches<TContext, TSchema, TEvent, TMatches>
  ];
}
