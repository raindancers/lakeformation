#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { WorldDataLakeFormation} from '../lib/stacks/datatake/theLake';
import { WorldData } from '../lib/applicationConstructs/worldData/worldData';

const app = new cdk.App();


const lake = new WorldDataLakeFormation(app, 'LakeStack', {
  makeCdkExecRoleLakeAdmin: false,
  // this should not be included in a production stack.
  nonproduction: true
  
});

// World data is an exaxmple of calling an API, getting a json response and creating a Database in teh Lake
new WorldData(app, 'WorldData', {
  datalake:lake.datalake,
  targetBucket: lake.bronze,
  bucketsuffix: 'ingest/worldData/worldData.json'
})



