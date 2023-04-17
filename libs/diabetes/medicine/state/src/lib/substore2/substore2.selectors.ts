import { createSelector } from '@ngrx/store';
import { MedicineDomainSelector } from '../medicine.store';

export const selectSubstore2State = createSelector(
  MedicineDomainSelector,
  (domainState) => domainState.substore2
);

export const selectSubstore2Data = createSelector(
  selectSubstore2State,
  (state) => state.data
);
export const selectSubstore2Status = createSelector(
  selectSubstore2State,
  (state) => state.status
);
