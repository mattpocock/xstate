# xstate

## 5.0.0-next.0

### Major Changes

- [`7f3b8481`](https://github.com/davidkpiano/xstate/commit/7f3b84816564d951b6b29afdd7075256f1f59501) [#1045](https://github.com/davidkpiano/xstate/pull/1045) Thanks [@davidkpiano](https://github.com/davidkpiano)! - - The third argument of `machine.transition(state, event)` has been removed. The `context` should always be given as part of the `state`.

  - There is a new method: `machine.microstep(state, event)` which returns the resulting intermediate `State` object that represents a single microstep being taken when transitioning from `state` via the `event`. This is the `State` that does not take into account transient transitions nor raised events, and is useful for debugging.

  - The `state.events` property has been removed from the `State` object, and is replaced internally by `state._internalQueue`, which represents raised events to be processed in a macrostep loop. The `state._internalQueue` property should be considered internal (not used in normal development).

  - The `state.historyValue` property now more closely represents the original SCXML algorithm, and is a mapping of state node IDs to their historic descendent state nodes. This is used for resolving history states, and should be considered internal.

  - The `stateNode.isTransient` property is removed from `StateNode`.

  - The `.initial` property of a state node config object can now contain executable content (i.e., actions):

  ```js
  // ...
  initial: {
    target: 'someTarget',
    actions: [/* initial actions */]
  }
  ```

  - Assign actions (via `assign()`) will now be executed "in order", rather than automatically prioritized. They will be evaluated after previously defined actions are evaluated, and actions that read from `context` will have those intermediate values applied, rather than the final resolved value of all `assign()` actions taken, which was the previous behavior.

  This shouldn't change the behavior for most state machines. To maintain the previous behavior, ensure that `assign()` actions are defined before any other actions.

* [`172d6a7e`](https://github.com/davidkpiano/xstate/commit/172d6a7e1e4ab0fa73485f76c52675be8a1f3362) [#1260](https://github.com/davidkpiano/xstate/pull/1260) Thanks [@davidkpiano](https://github.com/davidkpiano)! - All generic types containing `TContext` and `TEvent` will now follow the same, consistent order:

  1. `TContext`
  2. `TEvent`
  3. ... All other generic types, including `TStateSchema,`TTypestate`, etc.

  ```diff
  -const service = interpret<SomeCtx, SomeSchema, SomeEvent>(someMachine);
  +const service = interpret<SomeCtx, SomeEvent, SomeSchema>(someMachine);
  ```

- [`e09efc72`](https://github.com/davidkpiano/xstate/commit/e09efc720f05246b692d0fdf17cf5d8ac0344ee6) [#878](https://github.com/davidkpiano/xstate/pull/878) Thanks [@Andarist](https://github.com/Andarist)! - Removed third parameter (context) from Machine's transition method. If you want to transition with a particular context value you should create appropriate `State` using `State.from`. So instead of this - `machine.transition('green', 'TIMER', { elapsed: 100 })`, you should do this - `machine.transition(State.from('green', { elapsed: 100 }), 'TIMER')`.

* [`145539c4`](https://github.com/davidkpiano/xstate/commit/145539c4cfe1bde5aac247792622428e44342dd6) [#1203](https://github.com/davidkpiano/xstate/pull/1203) Thanks [@davidkpiano](https://github.com/davidkpiano)! - - The `execute` option for an interpreted service has been removed. If you don't want to execute actions, it's recommended that you don't hardcode implementation details into the base `machine` that will be interpreted, and extend the machine's `options.actions` instead. By default, the interpreter will execute all actions according to SCXML semantics (immediately upon transition).

  - Dev tools integration has been simplified, and Redux dev tools support is no longer the default. It can be included from `xstate/devTools/redux`:

  ```js
  import { interpret } from 'xstate';
  import { createReduxDevTools } from 'xstate/devTools/redux';

  const service = interpret(someMachine, {
    devTools: createReduxDevTools({
      // Redux Dev Tools options
    })
  });
  ```

  By default, dev tools are attached to the global `window.__xstate__` object:

  ```js
  const service = interpret(someMachine, {
    devTools: true // attaches via window.__xstate__.register(service)
  });
  ```

  And creating your own custom dev tools adapter is a function that takes in the `service`:

  ```js
  const myCustomDevTools = service => {
    console.log('Got a service!');

    service.subscribe(state => {
      // ...
    });
  };

  const service = interpret(someMachine, {
    devTools: myCustomDevTools
  });
  ```

  - These handlers have been removed, as they are redundant and can all be accomplished with `.onTransition(...)` and/or `.subscribe(...)`:

    - `service.onEvent()`
    - `service.onSend()`
    - `service.onChange()`

  - The `service.send(...)` method no longer returns the next state. It is a `void` function (fire-and-forget).

  - The `service.sender(...)` method has been removed as redundant. Use `service.send(...)` instead.

- [`3de36bb2`](https://github.com/davidkpiano/xstate/commit/3de36bb24e8f59f54d571bf587407b1b6a9856e0) [#953](https://github.com/davidkpiano/xstate/pull/953) Thanks [@davidkpiano](https://github.com/davidkpiano)! - Support for getters as a transition target (instead of referencing state nodes by ID or relative key) has been removed.

  The `Machine()` and `createMachine()` factory functions no longer support passing in `context` as a third argument.

  The `context` property in the machine configuration no longer accepts a function for determining context (which was introduced in 4.7). This might change as the API becomes finalized.

  The `activities` property was removed from `State` objects, as activities are now part of `invoke` declarations.

  The state nodes will not show the machine's `version` on them - the `version` property is only available on the root machine node.

  The `machine.withContext({...})` method now permits providing partial context, instead of the entire machine context.

* [`97b05690`](https://github.com/davidkpiano/xstate/commit/97b05690cd8b30824eb176c813a145d3ef0d2a78) [#901](https://github.com/davidkpiano/xstate/pull/901) Thanks [@davidkpiano](https://github.com/davidkpiano)! - Simplified invoke definition: the `invoke` property of a state definition will now only accept an `InvokeCreator`, which is a function that takes in context, event, and meta (parent, id, etc.) and returns an `Actor`.

  ```diff
  - invoke: someMachine
  + invoke: spawnMachine(someMachine)

  - invoke: (ctx, e) => somePromise
  + invoke: spawnPromise((ctx, e) => somePromise)

  - invoke: (ctx, e) => (cb, receive) => { ... }
  + invoke: spawnCallback((ctx, e) => (cb, receive) => { ... })

  - invoke: (ctx, e) => someObservable$
  + invoke: spawnObservable((ctx, e) => someObservable$)
  ```

  This also includes a helper function for spawning activities:

  ```diff
  - activity: (ctx, e) => { ... }
  + invoke: spawnActivity((ctx, e) => { ... })
  ```

- [`6043a1c2`](https://github.com/davidkpiano/xstate/commit/6043a1c28d21ff8cbabc420a6817a02a1a54fcc8) [#1240](https://github.com/davidkpiano/xstate/pull/1240) Thanks [@davidkpiano](https://github.com/davidkpiano)! - The `in: '...'` transition property can now be replaced with `stateIn(...)` and `stateNotIn(...)` guards, imported from `xstate/guards`:

  ```diff
  import {
    createMachine,
  + stateIn
  } from 'xstate/guards';

  const machine = createMachine({
    // ...
    on: {
      SOME_EVENT: {
        target: 'anotherState',
  -     in: '#someState',
  +     cond: stateIn('#someState')
      }
    }
  })
  ```

  The `stateIn(...)` and `stateNotIn(...)` guards also can be used the same way as `state.matches(...)`:

  ```js
  // ...
  SOME_EVENT: {
    target: 'anotherState',
    cond: stateNotIn({ red: 'stop' })
  }
  ```

  ***

  An error will now be thrown if the `assign(...)` action is executed when the `context` is `undefined`. Previously, there was only a warning.

  ***

  The SCXML event `error.execution` will be raised if assignment in an `assign(...)` action fails.

  ***

  Error events raised by the machine will be _thrown_ if there are no error listeners registered on a service via `service.onError(...)`.

* [`0e24ea6d`](https://github.com/davidkpiano/xstate/commit/0e24ea6d62a5c1a8b7e365f2252dc930d94997c4) [#987](https://github.com/davidkpiano/xstate/pull/987) Thanks [@davidkpiano](https://github.com/davidkpiano)! - The `internal` property will no longer have effect for transitions on atomic (leaf-node) state nodes. In SCXML, `internal` only applies to complex (compound and parallel) state nodes:

  > Determines whether the source state is exited in transitions whose target state is a descendant of the source state. [See 3.13 Selecting and Executing Transitions for details.](https://www.w3.org/TR/scxml/#SelectingTransitions)

  ```diff
  // ...
  green: {
    on: {
      NOTHING: {
  -     target: 'green',
  -     internal: true,
        actions: doSomething
      }
    }
  }
  ```

- [`04e89f90`](https://github.com/davidkpiano/xstate/commit/04e89f90f97fe25a45b5908c45f25a513f0fd70f) [#987](https://github.com/davidkpiano/xstate/pull/987) Thanks [@davidkpiano](https://github.com/davidkpiano)! - The history resolution algorithm has been refactored to closely match the SCXML algorithm, which changes the shape of `state.historyValue` to map history state node IDs to their most recently resolved target state nodes.

* [`390eaaa5`](https://github.com/davidkpiano/xstate/commit/390eaaa523cb0dd243e39c6300e671606c1e45fc) [#1163](https://github.com/davidkpiano/xstate/pull/1163) Thanks [@davidkpiano](https://github.com/davidkpiano)! - **Breaking:** Activities are no longer a separate concept. Instead, activities are invoked. Internally, this is how activities worked. The API is consolidated so that `activities` are no longer a property of the state node or machine options:

  ```diff
  import { createMachine } from 'xstate';
  +import { invokeActivity } from 'xstate/invoke';

  const machine = createMachine(
    {
      // ...
  -   activities: 'someActivity',
  +   invoke: {
  +     src: 'someActivity'
  +   }
    },
    {
  -   activities: {
  +   behaviors: {
  -     someActivity: ((context, event) => {
  +     someActivity: invokeActivity((context, event) => {
          // ... some continuous activity

          return () => {
            // dispose activity
          }
        })
      }
    }
  );
  ```

  **Breaking:** The `services` option passed as the second argument to `createMachine(config, options)` is renamed to `behaviors`. Each value in `behaviors`should be a function that takes in `context` and `event` and returns a [behavior](TODO: link). The provided invoke creators are:

  - `invokeActivity`
  - `invokePromise`
  - `invokeCallback`
  - `invokeObservable`
  - `invokeMachine`

  ```diff
  import { createMachine } from 'xstate';
  +import { invokePromise } from 'xstate/invoke';

  const machine = createMachine(
    {
      // ...
      invoke: {
        src: 'fetchFromAPI'
      }
    },
    {
  -   services: {
  +   behaviors: {
  -     fetchFromAPI: ((context, event) => {
  +     fetchFromAPI: invokePromise((context, event) => {
          // ... (return a promise)
        })
      }
    }
  );
  ```

  **Breaking:** The `state.children` property is now a mapping of invoked actor IDs to their `ActorRef` instances.

  **Breaking:** The way that you interface with invoked/spawned actors is now through `ActorRef` instances. An `ActorRef` is an opaque reference to an `Actor`, which should be never referenced directly.

  **Breaking:** The `spawn` function is no longer imported globally. Spawning actors is now done inside of `assign(...)`, as seen below:

  ```diff
  -import { createMachine, spawn } from 'xstate';
  +import { createMachine } from 'xstate';

  const machine = createMachine({
    // ...
    entry: assign({
  -   someRef: (context, event) => {
  +   someRef: (context, event, { spawn }) => {
  -     return spawn(somePromise);
  +     return spawn.from(somePromise);
      }
    })
  });

  ```

  **Breaking:** The `src` of an `invoke` config is now either a string that references the machine's `options.behaviors`, or a `BehaviorCreator`, which is a function that takes in `context` and `event` and returns a `Behavior`:

  ```diff
  import { createMachine } from 'xstate';
  +import { invokePromise } from 'xstate/invoke';

  const machine = createMachine({
    // ...
    invoke: {
  -   src: (context, event) => somePromise
  +   src: invokePromise((context, event) => somePromise)
    }
    // ...
  });
  ```

  **Breaking:** The `origin` of an `SCXML.Event` is no longer a string, but an `ActorRef` instance.

- [`e09efc72`](https://github.com/davidkpiano/xstate/commit/e09efc720f05246b692d0fdf17cf5d8ac0344ee6) [#878](https://github.com/davidkpiano/xstate/pull/878) Thanks [@Andarist](https://github.com/Andarist)! - Support for compound string state values has been dropped from Machine's transition method. It's no longer allowed to call transition like this - `machine.transition('a.b', 'NEXT')`, instead it's required to use "state value" representation like this - `machine.transition({ a: 'b' }, 'NEXT')`.

* [`025a2d6a`](https://github.com/davidkpiano/xstate/commit/025a2d6a295359a746bee6ffc2953ccc51a6aaad) [#898](https://github.com/davidkpiano/xstate/pull/898) Thanks [@davidkpiano](https://github.com/davidkpiano)! - - Breaking: activities removed (can be invoked)

  Since activities can be considered invoked services, they can be implemented as such. Activities are services that do not send any events back to the parent machine, nor do they receive any events, other than a "stop" signal when the parent changes to a state where the activity is no longer active. This is modeled the same way as a callback service is modeled.

- [`e09efc72`](https://github.com/davidkpiano/xstate/commit/e09efc720f05246b692d0fdf17cf5d8ac0344ee6) [#878](https://github.com/davidkpiano/xstate/pull/878) Thanks [@Andarist](https://github.com/Andarist)! - Removed previously deprecated config properties: `onEntry`, `onExit`, `parallel` and `forward`.

* [`53a594e9`](https://github.com/davidkpiano/xstate/commit/53a594e9a1b49ccb1121048a5784676f83950024) [#1054](https://github.com/davidkpiano/xstate/pull/1054) Thanks [@Andarist](https://github.com/Andarist)! - `Machine#transition` no longer handles invalid state values such as values containing non-existent state regions. If you rehydrate your machines and change machine's schema then you should migrate your data accordingly on your own.

- [`31a0d890`](https://github.com/davidkpiano/xstate/commit/31a0d890f55d8f0b06772c9fd510b18302b76ebb) [#1002](https://github.com/davidkpiano/xstate/pull/1002) Thanks [@Andarist](https://github.com/Andarist)! - Removed support for `service.send(type, payload)`. We are using `send` API at multiple places and this was the only one supporting this shape of parameters. Additionally, it had not strict TS types and using it was unsafe (type-wise).

### Minor Changes

- [`b24e47b9`](https://github.com/davidkpiano/xstate/commit/b24e47b9e7a59a5b0527d4386cea3af16c84ca7a) [#1041](https://github.com/davidkpiano/xstate/pull/1041) Thanks [@Andarist](https://github.com/Andarist)! - Support for specifying states deep in the hierarchy has been added for the `initial` property. It's also now possible to specify multiple states as initial ones - so you can enter multiple descandants which have to be **parallel** to each other. Keep also in mind that you can only target descendant states with the `initial` property - it's not possible to target states from another regions.

  Those are now possible:

  ```js
  {
    initial: '#some_id',
    initial: ['#some_id', '#another_id'],
    initial: { target: '#some_id' },
    initial: { target: ['#some_id', '#another_id'] },
  }
  ```

* [`0c6cfee9`](https://github.com/davidkpiano/xstate/commit/0c6cfee9a6d603aa1756e3a6d0f76d4da1486caf) [#1028](https://github.com/davidkpiano/xstate/pull/1028) Thanks [@Andarist](https://github.com/Andarist)! - Added support for expressions to `cancel` action.

- [`4dbabfe7`](https://github.com/davidkpiano/xstate/commit/4dbabfe7d5ba154e852b4d460a2434c6fc955726) [#1320](https://github.com/davidkpiano/xstate/pull/1320) Thanks [@davidkpiano](https://github.com/davidkpiano)! - The `invoke.src` property now accepts an object that describes the invoke source with its `type` and other related metadata. This can be read from the `services` option in the `meta.src` argument:

  ```js
  const machine = createMachine(
    {
      initial: 'searching',
      states: {
        searching: {
          invoke: {
            src: {
              type: 'search',
              endpoint: 'example.com'
            }
            // ...
          }
          // ...
        }
      }
    },
    {
      services: {
        search: (context, event, { src }) => {
          console.log(src);
          // => { endpoint: 'example.com' }
        }
      }
    }
  );
  ```

  Specifying a string for `invoke.src` will continue to work the same; e.g., if `src: 'search'` was specified, this would be the same as `src: { type: 'search' }`.

### Patch Changes

- [`3ab3f25e`](https://github.com/davidkpiano/xstate/commit/3ab3f25ea297e4d770eef512e9583475c943845d) [#1285](https://github.com/davidkpiano/xstate/pull/1285) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with initial state of invoked machines being read without custom data passed to them which could lead to a crash when evaluating transient transitions for the initial state.

* [`a7da1451`](https://github.com/davidkpiano/xstate/commit/a7da14510fd1645ad041836b567771edb5b90827) [#1290](https://github.com/davidkpiano/xstate/pull/1290) Thanks [@davidkpiano](https://github.com/davidkpiano)! - The "Attempted to spawn an Actor [...] outside of a service. This will have no effect." warnings are now silenced for "lazily spawned" actors, which are actors that aren't immediately active until the function that creates them are called:

  ```js
  // ⚠️ "active" actor - will warn
  spawn(somePromise);

  // 🕐 "lazy" actor - won't warn
  spawn(() => somePromise);

  // 🕐 machines are also "lazy" - won't warn
  spawn(someMachine);
  ```

  It is recommended that all `spawn(...)`-ed actors are lazy, to avoid accidentally initializing them e.g., when reading `machine.initialState` or calculating otherwise pure transitions. In V5, this will be enforced.

- [`01e3e2dc`](https://github.com/davidkpiano/xstate/commit/01e3e2dcead63dce3eef5ab745395584efbf05fa) [#1320](https://github.com/davidkpiano/xstate/pull/1320) Thanks [@davidkpiano](https://github.com/davidkpiano)! - The JSON definition for `stateNode.invoke` objects will no longer include the `onDone` and `onError` transitions, since those transitions are already merged into the `transitions` array. This solves the issue of reviving a serialized machine from JSON, where before, the `onDone` and `onError` transitions for invocations were wrongly duplicated.

## 4.11.0

### Minor Changes

- [`36ed8d0a`](https://github.com/davidkpiano/xstate/commit/36ed8d0a3adf5b7fd187b0abe198220398e8b056) [#1262](https://github.com/davidkpiano/xstate/pull/1262) Thanks [@Andarist](https://github.com/Andarist)! - Improved type inference for `InvokeConfig['data']`. This has required renaming `data` property on `StateNode` instances to `doneData`. This property was never meant to be a part of the public API, so we don't consider this to be a breaking change.

* [`2c75ab82`](https://github.com/davidkpiano/xstate/commit/2c75ab822e49cb1a23c1e14eb7bd04548ab143eb) [#1219](https://github.com/davidkpiano/xstate/pull/1219) Thanks [@davidkpiano](https://github.com/davidkpiano)! - The resolved value of the `invoke.data` property is now available in the "invoke meta" object, which is passed as the 3rd argument to the service creator in `options.services`. This will work for all types of invoked services now, including promises, observables, and callbacks.

  ```js
  const machine = createMachine({
    initial: 'pending',
    context: {
      id: 42
    },
    states: {
      pending: {
        invoke: {
          src: 'fetchUser',
          data: {
            userId: (context) => context.id
          },
          onDone: 'success'
        }
      },
      success: {
        type: 'final'
      }
    }
  },
  {
    services: {
      fetchUser: (ctx, _, { data }) => {
        return fetch(`some/api/user/${data.userId}`)
          .then(response => response.json());
      }
    }
  }
  ```

- [`a6c78ae9`](https://github.com/davidkpiano/xstate/commit/a6c78ae960acba36b61a41a5d154ea59908010b0) [#1249](https://github.com/davidkpiano/xstate/pull/1249) Thanks [@davidkpiano](https://github.com/davidkpiano)! - New property introduced for eventless (transient) transitions: **`always`**, which indicates a transition that is always taken when in that state. Empty string transition configs for [transient transitions](https://xstate.js.org/docs/guides/transitions.html#transient-transitions) are deprecated in favor of `always`:

  ```diff
  // ...
  states: {
    playing: {
  +   always: [
  +     { target: 'win', cond: 'didPlayerWin' },
  +     { target: 'lose', cond: 'didPlayerLose' },
  +   ],
      on: {
        // ⚠️ Deprecation warning
  -     '': [
  -       { target: 'win', cond: 'didPlayerWin' },
  -       { target: 'lose', cond: 'didPlayerLose' },
  -     ]
      }
    }
  }
  // ...
  ```

  The old empty string syntax (`'': ...`) will continue to work until V5.

### Patch Changes

- [`36ed8d0a`](https://github.com/davidkpiano/xstate/commit/36ed8d0a3adf5b7fd187b0abe198220398e8b056) [#1262](https://github.com/davidkpiano/xstate/pull/1262) Thanks [@Andarist](https://github.com/Andarist)! - `StateMachine<any, any, any>` is no longer a part of the `InvokeConfig` type, but rather it creates a union with `InvokeConfig` in places where it is needed. This change shouldn't affect consumers' code.

## 4.10.0

### Minor Changes

- [`0133954`](https://github.com/davidkpiano/xstate/commit/013395463b955e950ab24cb4be51faf524b0de6e) [#1178](https://github.com/davidkpiano/xstate/pull/1178) Thanks [@davidkpiano](https://github.com/davidkpiano)! - The types for the `send()` and `sendParent()` action creators have been changed to fix the issue of only being able to send events that the machine can receive. In reality, a machine can and should send events to other actors that it might not be able to receive itself. See [#711](https://github.com/davidkpiano/xstate/issues/711) for more information.

* [`a1f1239`](https://github.com/davidkpiano/xstate/commit/a1f1239e20e05e338ed994d031e7ef6f2f09ad68) [#1189](https://github.com/davidkpiano/xstate/pull/1189) Thanks [@davidkpiano](https://github.com/davidkpiano)! - Previously, `state.matches(...)` was problematic because it was casting `state` to `never` if it didn't match the state value. This is now fixed by making the `Typestate` resolution more granular.

- [`dbc6a16`](https://github.com/davidkpiano/xstate/commit/dbc6a161c068a3e12dd12452b68a66fe3f4fb8eb) [#1183](https://github.com/davidkpiano/xstate/pull/1183) Thanks [@davidkpiano](https://github.com/davidkpiano)! - Actions from a restored state provided as a custom initial state to `interpret(machine).start(initialState)` are now executed properly. See #1174 for more information.

### Patch Changes

- [`a10d604`](https://github.com/davidkpiano/xstate/commit/a10d604a6afcf39048b02be5436acdd197f16c2b) [#1176](https://github.com/davidkpiano/xstate/pull/1176) Thanks [@itfarrier](https://github.com/itfarrier)! - Fix passing state schema into State generic

* [`326db72`](https://github.com/davidkpiano/xstate/commit/326db725e50f7678af162626c6c7491e4364ec07) [#1185](https://github.com/davidkpiano/xstate/pull/1185) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with invoked service not being correctly started if other service got stopped in a subsequent microstep (in response to raised or null event).

- [`c3a496e`](https://github.com/davidkpiano/xstate/commit/c3a496e1f92ec27db0643fd1ddc32d683db4e751) [#1160](https://github.com/davidkpiano/xstate/pull/1160) Thanks [@davidkpiano](https://github.com/davidkpiano)! - Delayed transitions defined using `after` were previously causing a circular dependency when the machine was converted using `.toJSON()`. This has now been fixed.

* [`e16e48e`](https://github.com/davidkpiano/xstate/commit/e16e48e05e6243a3eacca58a13d3e663cd641f55) [#1153](https://github.com/davidkpiano/xstate/pull/1153) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with `choose` and `pure` not being able to use actions defined in options.

- [`d496ecb`](https://github.com/davidkpiano/xstate/commit/d496ecb11b26011f2382d1ce6c4433284a7b3e9b) [#1165](https://github.com/davidkpiano/xstate/pull/1165) Thanks [@davidkpiano](https://github.com/davidkpiano)! - XState will now warn if you define an `.onDone` transition on the root node. Root nodes which are "done" represent the machine being in its final state, and can no longer accept any events. This has been reported as confusing in [#1111](https://github.com/davidkpiano/xstate/issues/1111).

## 4.9.1

### Patch Changes

- [`8a97785`](https://github.com/davidkpiano/xstate/commit/8a97785055faaeb1b36040dd4dc04e3b90fa9ec2) [#1137](https://github.com/davidkpiano/xstate/pull/1137) Thanks [@davidkpiano](https://github.com/davidkpiano)! - Added docs for the `choose()` and `pure()` action creators, as well as exporting the `pure()` action creator in the `actions` object.

* [`e65dee9`](https://github.com/davidkpiano/xstate/commit/e65dee928fea60df1e9f83c82fed8102dfed0000) [#1131](https://github.com/davidkpiano/xstate/pull/1131) Thanks [@wKovacs64](https://github.com/wKovacs64)! - Include the new `choose` action in the `actions` export from the `xstate` core package. This was missed in v4.9.0.

## 4.9.0

### Minor Changes

- [`f3ff150`](https://github.com/davidkpiano/xstate/commit/f3ff150f7c50f402704d25cdc053b76836e447e3) [#1103](https://github.com/davidkpiano/xstate/pull/1103) Thanks [@davidkpiano](https://github.com/davidkpiano)! - Simplify the `TransitionConfigArray` and `TransitionConfigMap` types in order to fix excessively deep type instantiation TypeScript reports. This addresses [#1015](https://github.com/davidkpiano/xstate/issues/1015).

* [`6c47b66`](https://github.com/davidkpiano/xstate/commit/6c47b66c3289ff161dc96d9b246873f55c9e18f2) [#1076](https://github.com/davidkpiano/xstate/pull/1076) Thanks [@Andarist](https://github.com/Andarist)! - Added support for conditional actions. It's possible now to have actions executed based on conditions using following:

  ```js
  entry: [
    choose([
      { cond: ctx => ctx > 100, actions: raise('TOGGLE') },
      {
        cond: 'hasMagicBottle',
        actions: [assign(ctx => ({ counter: ctx.counter + 1 }))]
      },
      { actions: ['fallbackAction'] }
    ])
  ];
  ```

  It works very similar to the if-else syntax where only the first matched condition is causing associated actions to be executed and the last ones can be unconditional (serving as a general fallback, just like else branch).

### Patch Changes

- [`1a129f0`](https://github.com/davidkpiano/xstate/commit/1a129f0f35995981c160d756a570df76396bfdbd) [#1073](https://github.com/davidkpiano/xstate/pull/1073) Thanks [@Andarist](https://github.com/Andarist)! - Cleanup internal structures upon receiving termination events from spawned actors.

* [`e88aa18`](https://github.com/davidkpiano/xstate/commit/e88aa18431629e1061b74dfd4a961b910e274e0b) [#1085](https://github.com/davidkpiano/xstate/pull/1085) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with data expressions of root's final nodes being called twice.

- [`88b17b2`](https://github.com/davidkpiano/xstate/commit/88b17b2476ff9a0fbe810df9d00db32c2241cd6e) [#1090](https://github.com/davidkpiano/xstate/pull/1090) Thanks [@rjdestigter](https://github.com/rjdestigter)! - This change carries forward the typestate type information encoded in the arguments of the following functions and assures that the return type also has the same typestate type information:

  - Cloned state machine returned by `.withConfig`.
  - `.state` getter defined for services.
  - `start` method of services.

* [`d5f622f`](https://github.com/davidkpiano/xstate/commit/d5f622f68f4065a2615b5a4a1caae6b508b4840e) [#1069](https://github.com/davidkpiano/xstate/pull/1069) Thanks [@davidkpiano](https://github.com/davidkpiano)! - Loosened event type for `SendAction<TContext, AnyEventObject>`

## 4.8.0

### Minor Changes

- [`55aa589`](https://github.com/davidkpiano/xstate/commit/55aa589648a9afbd153e8b8e74cbf2e0ebf573fb) [#960](https://github.com/davidkpiano/xstate/pull/960) Thanks [@davidkpiano](https://github.com/davidkpiano)! - The machine can now be safely JSON-serialized, using `JSON.stringify(machine)`. The shape of this serialization is defined in `machine.schema.json` and reflected in `machine.definition`.

  Note that `onEntry` and `onExit` have been deprecated in the definition in favor of `entry` and `exit`.

### Patch Changes

- [`1ae31c1`](https://github.com/davidkpiano/xstate/commit/1ae31c17dc81fb63e699b4b9bf1cf4ead023001d) [#1023](https://github.com/davidkpiano/xstate/pull/1023) Thanks [@Andarist](https://github.com/Andarist)! - Fixed memory leak - `State` objects had been retained in closures.

## 4.7.8

### Patch Changes

- [`520580b`](https://github.com/davidkpiano/xstate/commit/520580b4af597f7c83c329757ae972278c2d4494) [#967](https://github.com/davidkpiano/xstate/pull/967) Thanks [@andrewgordstewart](https://github.com/andrewgordstewart)! - Add context & event types to InvokeConfig

## 4.7.7

### Patch Changes

- [`c8db035`](https://github.com/davidkpiano/xstate/commit/c8db035b90a7ab4a557359d493d3dd7973dacbdd) [#936](https://github.com/davidkpiano/xstate/pull/936) Thanks [@davidkpiano](https://github.com/davidkpiano)! - The `escalate()` action can now take in an expression, which will be evaluated against the `context`, `event`, and `meta` to return the error data.

* [`2a3fea1`](https://github.com/davidkpiano/xstate/commit/2a3fea18dcd5be18880ad64007d44947cc327d0d) [#952](https://github.com/davidkpiano/xstate/pull/952) Thanks [@davidkpiano](https://github.com/davidkpiano)! - The typings for the raise() action have been fixed to allow any event to be raised. This typed behavior will be refined in version 5, to limit raised events to those that the machine accepts.

- [`f86d419`](https://github.com/davidkpiano/xstate/commit/f86d41979ed108e2ac4df63299fc16f798da69f7) [#957](https://github.com/davidkpiano/xstate/pull/957) Thanks [@Andarist](https://github.com/Andarist)! - Fixed memory leak - each created service has been registered in internal map but it was never removed from it. Registration has been moved to a point where Interpreter is being started and it's deregistered when it is being stopped.

## 4.7.6

### Patch Changes

- dae8818: Typestates are now propagated to interpreted services.

## 4.7.5

### Patch Changes

- 6b3d767: Fixed issue with delayed transitions scheduling a delayed event for each transition defined for a single delay.

## 4.7.4

### Patch Changes

- 9b043cd: The initial state is now cached inside of the service instance instead of the machine, which was the previous (faulty) strategy. This will prevent entry actions on initial states from being called more than once, which is important for ensuring that actors are not spawned more than once.

## 4.7.3

### Patch Changes

- 2b134eee: Fixed issue with events being forwarded to children after being processed by the current machine. Events are now always forwarded first.
- 2b134eee: Fixed issue with not being able to spawn an actor when processing an event batch.
