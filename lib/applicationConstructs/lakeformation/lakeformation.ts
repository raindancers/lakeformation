import * as cdk from 'aws-cdk-lib';
import {
  aws_s3 as s3,
  aws_lakeformation as lakeformation,
  aws_iam as iam,
  aws_glue as glue,
} from 'aws-cdk-lib';

import * as glue_alpha from '@aws-cdk/aws-glue-alpha';
import * as gluedatabase from '../gluedatabase/gluedatabase'

import * as constructs from 'constructs';
import { createWriteStream } from 'fs';

export interface LakeFormationProps {
	
}


export class LakeFormation extends constructs.Construct {

  constructor(scope: constructs.Construct, id: string, props: LakeFormationProps) {
    super(scope, id); 
  }

  public addNewBucketToLakeFormation(name: string, role?: iam.Role ): s3.Bucket {

    const bucket = new s3.Bucket(this, name, {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED
    })

    if (role) {
      new lakeformation.CfnResource(this, `associateBucket${name}`, {
        resourceArn: bucket.bucketArn,
        roleArn: role.roleArn,
        useServiceLinkedRole: false,
      });
    } else { 
        new lakeformation.CfnResource(this, `associateBucket${name}`, {
          resourceArn: bucket.bucketArn,
          useServiceLinkedRole: true,
        });
	}
    return bucket
  }
  /**
   * 
   * @param databaseName 
   * @param bucket S3 bucket
   * @param bucketSuffix include the leading / in teh suffice.
   * @returns 
   */
  public addS3IngestDatabase(databaseName: string, bucket: s3.Bucket, bucketSuffix: string): gluedatabase.IngestDataBase {
	
	return new gluedatabase.IngestDataBase(this, databaseName, {
		databaseName: databaseName,
		bucket: bucket,
		bucketSuffix: bucketSuffix
	})
  }
}
