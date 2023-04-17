import {
  Action,
  ActionReducer,
  combineReducers,
  createFeatureSelector,
} from '@ngrx/store';
import {
  substore2Reducer,
  Substore2State,
} from './substore2/substore2.reducer';

export const MEDICINE_DOMAIN_FEATURE_KEY = 'Medicine';

export const MedicineDomainSelector =
  createFeatureSelector<MedicineDomainState>(MEDICINE_DOMAIN_FEATURE_KEY);

// Type used to enforce correlation
// between state type and reducer combination,
type reducerKeysType<T> = {
  [K in keyof T]: ActionReducer<T[K], Action>;
};
type reducerCombinationType = reducerKeysType<MedicineDomainState>;

// Add new reducers to this object to keep them under the correct
// domain node in debug tools. Domain state interface below must also be updated.
const reducerObj: reducerCombinationType = { substore2: Substore2Reducer };

export const MedicineDomainCombinedReducers = combineReducers(reducerObj);
export interface MedicineDomainState {
  substore2: Substore2State;
}
