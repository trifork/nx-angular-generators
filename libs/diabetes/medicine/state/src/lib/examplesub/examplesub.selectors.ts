import { createSelector } from '@ngrx/store';
import { MedicineDomainSelector } from '../medicine.store';

export const selectExamplesubState = createSelector(MedicineDomainSelector, (domainState) => domainState.Examplesub);

export const selectExamplesubData = createSelector(selectExamplesubState, (state) => state.data);
export const selectExamplesubStatus = createSelector(selectExamplesubState, (state) => state.status);