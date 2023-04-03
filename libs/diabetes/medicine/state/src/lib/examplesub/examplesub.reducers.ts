import { createReducer, on } from '@ngrx/store';

import * as actions from './examplesub.actions';

export enum HttpRequestStatus {
  IDLE = 'IDLE',
  IN_PROGRESS = 'IN_PROGRESS',
  FAILURE = 'FAILURE',
  SUCCESS = 'SUCCESS',
}

export interface ExamplesubState {
  data: string;
  status: HttpRequestStatus;
}

export const InitialState: ExamplesubState = {
  data: '',
  status: HttpRequestStatus.IDLE,
};

export const ExamplesubReducer = createReducer(
  InitialState,
  on(actions.getData, (state) => ({
    ...state,
    status: HttpRequestStatus.IN_PROGRESS,
  })),
  on(actions.getDataFailure, (state) => ({
    ...state,
    data: '',
    status: HttpRequestStatus.FAILURE,
  })),
  on(actions.getDataSuccess, (state, action) => ({
    ...state,
    data: action.data,
    status: HttpRequestStatus.SUCCESS,
  }))
);
