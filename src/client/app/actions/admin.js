/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import axios from 'axios';
import { changeBarStacking, changeChartToRender } from './graph';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import { getToken } from '../utils/token';

export const UPDATE_DISPLAY_TITLE = 'UPDATE_DISPLAY_TITLE';
export const UPDATE_DEFAULT_CHART_TO_RENDER = 'UPDATE_DEFAULT_CHART_TO_RENDER';
export const TOGGLE_DEFAULT_BAR_STACKING = 'TOGGLE_DEFAULT_BAR_STACKING';
export const REQUEST_PREFERENCES = 'REQUEST_PREFERENCES';
export const RECEIVE_PREFERENCES = 'RECEIVE_PREFERENCES';
export const TOGGLE_IS_SUBMITTING_PREFERENCES = 'TOGGLE_IS_SUBMITTING_PREFERENCES';

export function updateDisplayTitle(displayTitle) {
	return { type: UPDATE_DISPLAY_TITLE, displayTitle };
}

export function updateDefaultChartToRender(defaultChartToRender) {
	return { type: UPDATE_DEFAULT_CHART_TO_RENDER, defaultChartToRender };
}

export function toggleDefaultBarStacking() {
	return { type: TOGGLE_DEFAULT_BAR_STACKING };
}

function requestPreferences() {
	return { type: REQUEST_PREFERENCES };
}

function receivePreferences(data) {
	return { type: RECEIVE_PREFERENCES, data };
}

function toggleIsSubmittingPreferences() {
	return { type: TOGGLE_IS_SUBMITTING_PREFERENCES };
}

function fetchPreferences() {
	return dispatch => {
		dispatch(requestPreferences());
		return axios.get('/api/preferences')
			.then(response => {
				dispatch(receivePreferences(response.data));
				dispatch((dispatch2, getState) => {
					const state = getState();
					dispatch2(changeChartToRender(state.admin.defaultChartToRender));
					if (response.data.defaultBarStacking !== state.graph.barStacking) {
						dispatch2(changeBarStacking());
					}
				});
			});
	};
}

function submitPreferences() {
	return (dispatch, getState) => {
		const state = getState();
		dispatch(toggleIsSubmittingPreferences());
		return axios.post('/api/preferences',
			{
				token: getToken(),
				preferences: {
					displayTitle: state.admin.displayTitle,
					defaultChartToRender: state.admin.defaultChartToRender,
					defaultBarStacking: state.admin.defaultBarStacking
				}
			})
			.then(() => {
				showSuccessNotification('Updated preferences');
				dispatch(toggleIsSubmittingPreferences());
			})
			.catch(() => {
				showErrorNotification('Failed to submit changes');
				dispatch(toggleIsSubmittingPreferences());
			}
		);
	};
}

function shouldFetchPreferenceData(state) {
	return !state.admin.isFetching;
}

function shouldSubmitPreferenceData(state) {
	return !state.admin.isSubmitting;
}

export function fetchPreferencesIfNeeded() {
	return (dispatch, getState) => {
		if (shouldFetchPreferenceData(getState())) {
			return dispatch(fetchPreferences());
		}
		return Promise.resolve();
	};
}

export function submitPreferencesIfNeeded() {
	return (dispatch, getState) => {
		if (shouldSubmitPreferenceData(getState())) {
			return dispatch(submitPreferences());
		}
		return Promise.resolve();
	};
}
