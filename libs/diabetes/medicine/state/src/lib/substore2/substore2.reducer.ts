import { createReducer, on } from '@ngrx/store';

import * as actions from './substore2.actions';

export enum HttpRequestStatus {
  IDLE = 'IDLE',
  IN_PROGRESS = 'IN_PROGRESS',
  FAILURE = 'FAILURE',
  SUCCESS = 'SUCCESS',
}

export interface Substore2State {
  data: string;
  status: HttpRequestStatus;
}

export const initialState: Substore2State = {
  data: '',
  status: HttpRequestStatus.IDLE,
};

export const substore2Reducer = createReducer(
  initialState,
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
