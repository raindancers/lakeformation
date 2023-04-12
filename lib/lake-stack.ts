import * as cdk from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import * as constructs from 'constructs';
import * as lakeformation from '../lib/applicationConstructs/lakeformation/lakeformation'

export class LakeStack extends cdk.Stack {

  datalake: lakeformation.LakeFormation;
  bronze: s3.Bucket;
  silver: s3.Bucket;
  gold: s3.Bucket;

  constructor(scope: constructs.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // This is a convience class only, as a way to hold the methods. 
    this.datalake = new lakeformation.LakeFormation(this, 'LakeFormation', {
      // THIS MUST BE REMOVED BEFORE PRODUCTION!!!!
      nonproduction: true 
    })

    // create and add new buckets to the datalake;
    this.bronze = this.datalake.addNewBucketToLakeFormation({
      name: 'bronze'
    });

    this.silver = this.datalake.addNewBucketToLakeFormation({
      name: 'silver'
    });

    this.gold = this.datalake.addNewBucketToLakeFormation({
      name: 'gold'
    });

    // need to make CDK execution role a datalake-administrator.. where shoudl this be done?

  }
}
