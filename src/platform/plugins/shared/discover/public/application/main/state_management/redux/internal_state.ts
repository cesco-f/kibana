/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { DataTableRecord } from '@kbn/discover-utils';
import { v4 as uuidv4 } from 'uuid';
import {
  type PayloadAction,
  configureStore,
  createSlice,
  type ThunkAction,
  type ThunkDispatch,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import type { IKbnUrlStateStorage } from '@kbn/kibana-utils-plugin/public';
import type { DiscoverCustomizationContext } from '../../../../customizations';
import type { DiscoverServices } from '../../../../build_services';
import type { RuntimeStateManager } from './runtime_state';
import {
  LoadingStatus,
  type DiscoverInternalState,
  type InternalStateDataRequestParams,
} from './types';

const initialState: DiscoverInternalState = {
  initializationState: { hasESData: false, hasUserDataView: false },
  dataViewId: undefined,
  isDataViewLoading: false,
  defaultProfileAdHocDataViewIds: [],
  savedDataViews: [],
  expandedDoc: undefined,
  dataRequestParams: {},
  overriddenVisContextAfterInvalidation: undefined,
  isESQLToDataViewTransitionModalVisible: false,
  resetDefaultProfileState: {
    resetId: '',
    columns: false,
    rowHeight: false,
    breakdownField: false,
  },
  documentsRequest: {
    loadingStatus: LoadingStatus.Uninitialized,
    result: [],
  },
  totalHitsRequest: {
    loadingStatus: LoadingStatus.Uninitialized,
    result: 0,
  },
  chartRequest: {
    loadingStatus: LoadingStatus.Uninitialized,
    result: {},
  },
};

const createInternalStateAsyncThunk = createAsyncThunk.withTypes<{
  state: DiscoverInternalState;
  dispatch: InternalStateDispatch;
  extra: InternalStateThunkDependencies;
}>();

export const loadDataViewList = createInternalStateAsyncThunk(
  'internalState/loadDataViewList',
  async (_, { extra: { services } }) => services.dataViews.getIdsWithTitle(true)
);

export const internalStateSlice = createSlice({
  name: 'internalState',
  initialState,
  reducers: {
    setInitializationState: (
      state,
      action: PayloadAction<DiscoverInternalState['initializationState']>
    ) => {
      state.initializationState = action.payload;
    },

    setDataViewId: (state, action: PayloadAction<string | undefined>) => {
      if (action.payload !== state.dataViewId) {
        state.expandedDoc = undefined;
      }

      state.dataViewId = action.payload;
    },

    setIsDataViewLoading: (state, action: PayloadAction<boolean>) => {
      state.isDataViewLoading = action.payload;
    },

    setDefaultProfileAdHocDataViewIds: (state, action: PayloadAction<string[]>) => {
      state.defaultProfileAdHocDataViewIds = action.payload;
    },

    setExpandedDoc: (state, action: PayloadAction<DataTableRecord | undefined>) => {
      state.expandedDoc = action.payload;
    },

    setDataRequestParams: (state, action: PayloadAction<InternalStateDataRequestParams>) => {
      state.dataRequestParams = action.payload;
    },

    setOverriddenVisContextAfterInvalidation: (
      state,
      action: PayloadAction<DiscoverInternalState['overriddenVisContextAfterInvalidation']>
    ) => {
      state.overriddenVisContextAfterInvalidation = action.payload;
    },

    setIsESQLToDataViewTransitionModalVisible: (state, action: PayloadAction<boolean>) => {
      state.isESQLToDataViewTransitionModalVisible = action.payload;
    },

    setResetDefaultProfileState: {
      prepare: (
        resetDefaultProfileState: Omit<DiscoverInternalState['resetDefaultProfileState'], 'resetId'>
      ) => ({
        payload: {
          ...resetDefaultProfileState,
          resetId: uuidv4(),
        },
      }),
      reducer: (
        state,
        action: PayloadAction<DiscoverInternalState['resetDefaultProfileState']>
      ) => {
        state.resetDefaultProfileState = action.payload;
      },
    },

    resetOnSavedSearchChange: (state) => {
      state.overriddenVisContextAfterInvalidation = undefined;
      state.expandedDoc = undefined;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadDataViewList.fulfilled, (state, action) => {
      state.savedDataViews = action.payload;
    });
  },
});

export interface InternalStateThunkDependencies {
  services: DiscoverServices;
  customizationContext: DiscoverCustomizationContext;
  runtimeStateManager: RuntimeStateManager;
  urlStateStorage: IKbnUrlStateStorage;
}

export const createInternalStateStore = (options: InternalStateThunkDependencies) =>
  configureStore({
    reducer: internalStateSlice.reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: options } }),
  });

export type InternalStateStore = ReturnType<typeof createInternalStateStore>;

export type InternalStateDispatch = InternalStateStore['dispatch'];

type InternalStateThunkAction<TReturn = void> = ThunkAction<
  TReturn,
  InternalStateDispatch extends ThunkDispatch<infer TState, never, never> ? TState : never,
  InternalStateDispatch extends ThunkDispatch<never, infer TExtra, never> ? TExtra : never,
  InternalStateDispatch extends ThunkDispatch<never, never, infer TAction> ? TAction : never
>;

export type InternalStateThunkActionCreator<TArgs extends unknown[] = [], TReturn = void> = (
  ...args: TArgs
) => InternalStateThunkAction<TReturn>;
