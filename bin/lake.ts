#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { WorldDataLakeFormation} from '../lib/stacks/datatake/theLake';
import { WorldData } from '../lib/stacks/ingest/worldData/worldData'

const app = new cdk.App();


const lake = new WorldDataLakeFormation(app, 'LakeStack', {
  makeCdkExecRoleLakeAdmin: false,
  // this should not be included in a production stack.
  nonproduction: true
});

const worldData = new WorldData(app, 'WorldDataStack', {
  targetBucket: lake.bronze,
  bucketsuffix: 'ingest/worldData',
})
