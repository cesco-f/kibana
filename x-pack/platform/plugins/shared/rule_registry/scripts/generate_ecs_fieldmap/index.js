/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
const path = require('path');
const fs = require('fs');
const util = require('util');
const yaml = require('js-yaml');
const { exec: execCb } = require('child_process');
const { reduce } = require('lodash');

const exists = util.promisify(fs.exists);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const exec = util.promisify(execCb);

const ecsDir = path.resolve(__dirname, '../../../../../../../../ecs');
const ecsYamlFilename = path.join(ecsDir, 'generated/ecs/ecs_flat.yml');

const outputDir = path.join(__dirname, '../../common/assets/field_maps');

const outputFieldMapFilename = path.join(outputDir, 'ecs_field_map.ts');

async function generate() {
  if (!(await exists(ecsYamlFilename))) {
    throw new Error(
      `Directory not found: ${ecsYamlFilename} - did you checkout elastic/ecs as a peer of this repo?`
    );
  }

  const flatYaml = await yaml.load(await readFile(ecsYamlFilename));

  const fields = reduce(
    flatYaml,
    (fieldsObj, value, key) => {
      const field = {
        type: value.type,
        array: value.normalize.includes('array'),
        required: !!value.required,
      };

      if (value.scaling_factor) {
        field.scaling_factor = value.scaling_factor;
      }

      if (field.type !== 'constant_keyword') {
        fieldsObj[key] = field;
      }

      return fieldsObj;
    },
    {}
  );

  await writeFile(
    outputFieldMapFilename,
    `
/* This file is generated by x-pack/platform/plugins/shared/rule_registry/scripts/generate_ecs_fieldmap/index.js,
do not manually edit
*/

  export const ecsFieldMap = ${JSON.stringify(fields, null, 2)} as const

  export type EcsFieldMap = typeof ecsFieldMap;
  `,
    { encoding: 'utf-8' }
  );

  await exec(`node scripts/eslint --fix ${outputFieldMapFilename}`);
}

generate().catch((err) => {
  console.log(err);
  process.exit(1);
});
