import React from 'react'



type mixed = unknown; // Apparently mixed is a Flow thing
    
// https://github.com/facebook/react/blob/main/packages/shared/ReactTypes.js#L96C1-L139C1

// The subset of a Thenable required by things thrown by Suspense.
// This doesn't require a value to be passed to either handler.
export interface Wakeable {
    then(onFulfill: () => mixed, onReject: () => mixed): void | Wakeable;
  }
  
  // The subset of a Promise that React APIs rely on. This resolves a value.
  // This doesn't require a return value neither from the handler nor the
  // then function.
  interface ThenableImpl<T> {
    then(
      onFulfill: (value: T) => mixed,
      onReject: (error: mixed) => mixed,
    ): void | Wakeable;
  }
  interface UntrackedThenable<T> extends ThenableImpl<T> {
    status?: void;
    // _debugInfo?: null | ReactDebugInfo;
  }
  
  export interface PendingThenable<T> extends ThenableImpl<T> {
    status: 'pending';
    // _debugInfo?: null | ReactDebugInfo;
  }
  
  export interface FulfilledThenable<T> extends ThenableImpl<T> {
    status: 'fulfilled';
    value: T;
    // _debugInfo?: null | ReactDebugInfo;
  }
  
  export interface RejectedThenable<T> extends ThenableImpl<T> {
    status: 'rejected';
    reason: mixed;
    // _debugInfo?: null | ReactDebugInfo;
  }
  
  export type Thenable<T> =
    | UntrackedThenable<T>
    | PendingThenable<T>
    | FulfilledThenable<T>
    | RejectedThenable<T>;

    



type Usable<T> = Thenable<T>; //  | Context<T> Polyfill doesn't support

// inspo https://github.com/facebook/react/blob/09111202d617477b63507b41e8b6c3101b4afd87/packages/react/src/ReactHooks.js#L210
export type Use = <T>(
  usable: Usable<T>
) => T


/**
 * @description copy from swr
 */
export const use
// @ts-expect-error polyfill
  = React.use
  // This extra generic is to avoid TypeScript mixing up the generic and JSX sytax
  // and emitting an error.
  // We assume that this is only for the `use(thenable)` case, not `use(context)`.
  // Only supports 
  // https://github.com/facebook/react/blob/aed00dacfb79d17c53218404c52b1c7aa59c4a89/packages/react-server/src/ReactFizzThenable.js#L45
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  || ((<T, _>(
    thenable: Promise<T> & {
      status?: 'pending' | 'fulfilled' | 'rejected'
      value?: T
      reason?: unknown
    },
  ): T => {
    switch (thenable.status) {
      case 'pending':
        throw thenable
      case 'fulfilled':
        return thenable.value as T
      case 'rejected':
        throw thenable.reason
      default:
        thenable.status = 'pending'
        thenable.then(
          v => {
            thenable.status = 'fulfilled'
            thenable.value = v
          },
          e => {
            thenable.status = 'rejected'
            thenable.reason = e
          },
        )
        throw thenable
    }
  }) as Use)