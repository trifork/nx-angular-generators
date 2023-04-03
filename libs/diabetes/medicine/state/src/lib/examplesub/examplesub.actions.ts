import { createAction, props } from '@ngrx/store';

export const getData = createAction('[Data] Get Data', props<{ requestPayload: string }>());
export const getDataFailure = createAction('[Data] Get Data Failure');
export const getDataSuccess = createAction('[Data] Get Data Success', props<{ data: string }>());