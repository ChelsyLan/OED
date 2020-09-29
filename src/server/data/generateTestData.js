/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//import
const fs = require('fs');
const stringify = require('csv-stringify');
const _ = require('lodash');
const moment = require('moment');

var TWO_PI = Math.PI * 2;

// https://github.com/nodebox/g.js/blob/master/src/libraries/math.js#L315
// https://itnext.io/heres-why-mapping-a-constructed-array-doesn-t-work-in-javascript-f1195138615a
function sample(min, max, steps) {
	const stepSize = (max - min) / steps;
	const result = [...Array(steps + 1)].map((_, i) => min + i * stepSize);
	return result;
}
/* A function that determines the value of sine at a given x-value
 */
function sin(x, options = {}) {
	return Math.sin(x);
}

/* A function that takes an array of x-values and 
 * returns an array of sin at each corresponding x-value
 */
function sineWave(array, options = {}) {
	return array.map(x => [x, Math.sin(x)])
}

/** */
function waveGenerator(min, max, steps, waveFunction, options = {}) {
	const inputs = sample(min, max, steps);
	return waveFunction(inputs, options);
}

/** data needs to be of form
 * 
 * [
 * [...row],
 * [...row],
 * [...row],
 * 
 * ]
 */
// https://csv.js.org/stringify/api/
// https://stackoverflow.com/questions/2496710/writing-files-in-node-js
function write_to_csv(data, filename = 'test.csv') {
	stringify(data, (err, output) => {
		if (err) {
			return console.log(err);
		}
		fs.writeFile(filename, output, function (err) {
			if (err) {
				return console.log(err);
			}
			console.log("The file was saved!");
		});
	});
}

// we assume that the diff between consecutive array elements are equal
/* Given an array of something creat
 * Parameters: an array of moments, period
 * account for day in period, percentage
 */
function sectionInterval(array_from_start_to_end, period) {
	let buffer = [];
	const accumulator = [];
	if (array_from_start_to_end.length === 0) {
		return [];
	}
	array_from_start_to_end.forEach((element, idx) => {
		buffer.push(element);
		if (periodReached(buffer, period)) {
			accumulator.push(buffer);
			buffer = [];
		} else if (idx === array_from_start_to_end.length - 1) {
			accumulator.push(buffer);
			return accumulator;
		}
	});
	function periodReached(buffer, period) {
		return (buffer[buffer.length - 1] - buffer[0] + 1 === period);
	}
	return accumulator;
}

// chunk moments
// we assume that the period is greater than the difference
// between two consecutive moments
// period in milliseconds
function chunkMoments(array_of_moments, period) {
	if (array_of_moments.length <= 1) {
		return array_of_moments;
	}
	// initialize the buffer
	let buffer = [array_of_moments[0]];
	const moments = array_of_moments.slice(1);
	const accumulator = [];
	moments.forEach((element, idx) => {
		if (exceedsPeriod(buffer[0], element)) {
			// adding the next element would cause the
			// period of the buffer to exceed the specified period
			accumulator.push(buffer);
			buffer = [element];
		} else {
			// adding next element is safe
			buffer.push(element);
		}
		if (idx === moments.length - 1) {
			accumulator.push(buffer);
		}
	});
	function exceedsPeriod(startTime, endTime) {
		return endTime.diff(startTime) - period > 0;
	}
	return accumulator;
}
// convert moments into percentages
// https://stackoverflow.com/questions/18960327/javascript-moment-js-calculate-percentage-between-two-dates
// we assume that the first moment of the first subarray in the moments_array
// is the date of the entire period
function nested_moments(moments_array, period = 0) {
	if (moments_array.length === 0)
		return [];
	const moments_into_percentages = moments_array.map(moments => {
		const startDate = moments[0];
		const endDate = moments[moments.length - 1];
		// inaccurate when array is not properly aligned or diff'd
		return moments.map(single_moment => (single_moment - startDate) / (endDate - startDate))
	})
	return moments_into_percentages;
}

// apply the sin funciton on each percentaged moment
function sineOverEmbeddedPercentages(array_of_embedded_percentages) {
	if (array_of_embedded_percentages.length === 0) {
		return [];
	} else {
		return _.flatten(array_of_embedded_percentages.map(array_of_percentages => (array_of_percentages.map(result))))
	}
	function result(percentage) {
		return Math.sin(percentage * TWO_PI);
	}
}

module.exports = {
	chunkMoments,
	nested_moments,
	sineWave,
	sample,
	sectionInterval,
	sineOverEmbeddedPercentages,
	waveGenerator,
	write_to_csv,
}
