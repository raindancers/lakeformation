#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LakeStack } from '../lib/lake-stack';
import { ConditionAssessment } from '../lib/applicationConstructs/conditionAssessment/conditionAssessment'

const app = new cdk.App();
const lake = new LakeStack(app, 'LakeStack', {});

new ConditionAssessment(app, 'ConditionAssesement', {
  credentialsArn: 'arn:aws:secretsmanager:ap-southeast-2:847997321372:secret:conditionAssementAPI-80aQNQ',
  baseURL: 'https://moecat-test.assurasoftware.net/api/v2/',
  datalake: lake.datalake,
  targetBucket: lake.bronze,
  bucketsuffix: 'ingest/conditionassessment'
});