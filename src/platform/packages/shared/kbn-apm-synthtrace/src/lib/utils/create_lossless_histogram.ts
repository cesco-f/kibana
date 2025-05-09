/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { sortBy } from 'lodash';
import Histogram from 'hdr-histogram-js';

const ONE_HOUR_IN_MICRO_SECONDS = 1000 * 1000 * 60 * 60;

interface SerializedHistogram {
  counts: number[];
  values: number[];
  total: number;
  sum: number;
}

const MAX_VALUES_TO_TRACK_LOSSLESS = 10;

class LosslessHistogram {
  private backingHistogram: any;

  private readonly min: number;
  private readonly max: number;

  private readonly trackedValues: Map<number, number> = new Map();

  constructor(options?: { min?: number; max?: number }) {
    const { min, max } = options ?? {};
    this.min = min ?? 1;
    this.max = max ?? ONE_HOUR_IN_MICRO_SECONDS;
  }

  private getBackingHistogram() {
    if (this.backingHistogram) {
      return this.backingHistogram;
    }

    const histogram = Histogram.build({
      lowestDiscernibleValue: this.min,
      highestTrackableValue: this.max,
      useWebAssembly: false,
    });

    this.backingHistogram = histogram;

    if (this.trackedValues.size > 0) {
      this.trackedValues.forEach((count, value) => {
        histogram.recordValueWithCount(value, count);
      });
    }

    return histogram;
  }

  private linearCounts(valueUnitsPerBucket: number) {
    if (!this.backingHistogram) {
      return [];
    }

    const result = [];
    let value = valueUnitsPerBucket;

    while (value <= this.backingHistogram.maxValue) {
      let count = 0;

      // Sum counts within this bucket range
      for (let i = value - valueUnitsPerBucket + 1; i <= value; i++) {
        count += this.backingHistogram.getCountAtValue(i);
      }

      result.push({ count, value });
      value += valueUnitsPerBucket;
    }

    return result;
  }

  record(value: number) {
    const countForValue = this.trackedValues.get(value);
    if (
      this.backingHistogram &&
      countForValue === undefined &&
      this.trackedValues.size >= MAX_VALUES_TO_TRACK_LOSSLESS
    ) {
      this.getBackingHistogram().record(value);
      return;
    }

    this.trackedValues.set(value, 1 + (countForValue ?? 0));
  }

  serialize(): SerializedHistogram {
    if (this.backingHistogram) {
      const minRecordedValue = this.backingHistogram.minNonZeroValue;
      const maxRecordedValue = this.backingHistogram.maxValue;

      const distribution: Array<{ value: number; count: number }> = this.linearCounts(
        Math.max(1, (maxRecordedValue - minRecordedValue) / 50)
      );

      const values: number[] = [];
      const counts: number[] = [];

      let sum: number = 0;

      for (const { value, count } of distribution) {
        values.push(value);
        counts.push(count);
        sum += value * count;
      }

      return {
        values,
        counts,
        total: this.backingHistogram.totalCount,
        sum,
      };
    }

    const values: number[] = [];
    const counts: number[] = [];
    let total = 0;
    let sum = 0;

    let sortedValues: Array<{ value: number; count: number }> = [];

    this.trackedValues.forEach((count, value) => {
      sortedValues.push({ count, value });
    });

    sortedValues = sortBy(sortedValues, ({ value }) => value);

    sortedValues.forEach(({ value, count }) => {
      values.push(value);
      counts.push(count);
      total += count;
      sum += value * count;
    });

    return { values, counts, total, sum };
  }
}

export function createLosslessHistogram(options?: { min?: number; max?: number }) {
  return new LosslessHistogram(options);
}
