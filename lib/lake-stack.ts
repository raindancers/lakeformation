import * as cdk from 'aws-cdk-lib';
import {
  aws_s3 as s3
} from 'aws-cdk-lib';

import * as constructs from 'constructs';
import * as lakeformation from '../lib/applicationConstructs/lakeformation/lakeformation'

export class LakeStack extends cdk.Stack {
  constructor(scope: constructs.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // This is a convience class only, as a way to hold the methods. 
    const mylake = new lakeformation.LakeFormation(this, 'LakeFormation', {})

    // create and add new buckets to the datalake;
    const bronze = mylake.addNewBucketToLakeFormation('bronzebucket')
    const silver = mylake.addNewBucketToLakeFormation('silverbucket')
    const gold = mylake.addNewBucketToLakeFormation('goldbucket')

    // need to make CDK execution role a datalake-administrator.. where shoudl this be done?

    // this will create a database band i 
    const ingestdatabase = mylake.addS3IngestDatabase('s3ingest', bronze, '/ingest/')  
    ingestdatabase.addS3Crawler({
      name: 'GetsomeCSV',
      description: 'Get the CSV Files',
    }); 
  }
}
