import * as cdk from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import * as constructs from 'constructs';
import * as lakeformation from '../../applicationConstructs/lakeformation/lakeformation'


export interface LakeStackProps extends cdk.StackProps {
  makeCdkExecRoleLakeAdmin?: boolean | undefined
  nonproduction?: boolean | undefined
}


export class WorldDataLakeFormation extends cdk.Stack {

  datalake: lakeformation.LakeFormation;
  bronze: s3.Bucket;
  silver: s3.Bucket;
  gold: s3.Bucket;

  constructor(scope: constructs.Construct, id: string, props: LakeStackProps) {
    super(scope, id, props);


    
    this.datalake = new lakeformation.LakeFormation(this, 'LakeFormation', {
      nonproduction: props.nonproduction,
      makeCdkExecRoleLakeAdmin: props.makeCdkExecRoleLakeAdmin,
    })

    // create and add new buckets to the datalake;
    this.bronze = this.datalake.addNewBucketToLakeFormation({
      name: 'TESTbronze'
    }); 

    this.silver = this.datalake.addNewBucketToLakeFormation({
      name: 'TESTsilver'
    });

    this.gold = this.datalake.addNewBucketToLakeFormation({
      name: 'TESTgold'
    });


  }
}
