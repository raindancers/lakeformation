import * as cdk from 'aws-cdk-lib';
import {
  aws_s3 as s3,
  aws_lakeformation as lakeformation,
  aws_iam as iam,
} from 'aws-cdk-lib';

import * as gluedatabase from '../gluedatabase/gluedatabase'

import * as constructs from 'constructs';

export interface AddNewBucketToLakeFormationProps {
  name: string,
  role?: iam.Role,
  lifecycleRules?: s3.LifecycleRule[] | undefined,
}

export interface AddS3IngestDatabaseProps {
  databaseName: string, 
  bucket: s3.Bucket, 
  bucketSuffix: string
}

export interface LakeFormationProps {
  /**
   * Opt out of Mechanisms for high data protection, that are appropriate for production
   */
  nonproduction?: boolean

}


export class LakeFormation extends constructs.Construct {

  nonproduction: boolean | undefined; 

  constructor(scope: constructs.Construct, id: string, props: LakeFormationProps) {
    super(scope, id); 

    if (props.nonproduction) {
      this.nonproduction = true
    };
  }

  public addNewBucketToLakeFormation(props: AddNewBucketToLakeFormationProps): s3.Bucket {

    var bucket: s3.Bucket;

    // this lifecycle policy will be applied to the bucket by default if non is applied. 
    const defaultLifeCycleRules = [
      {
        abortIncompleteMultipartUploadAfter: cdk.Duration.days(90),
        transitions: [
          {
            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
            transitionAfter: cdk.Duration.days(30),
          },
          {
            storageClass: s3.StorageClass.INTELLIGENT_TIERING,
            transitionAfter: cdk.Duration.days(60),
          },
          {
            storageClass: s3.StorageClass.GLACIER,
            transitionAfter: cdk.Duration.days(180),
          },
          {
            storageClass: s3.StorageClass.DEEP_ARCHIVE,
            transitionAfter: cdk.Duration.days(365),
          },
        ],
      }
    ]

    var autoDeleteObjects: boolean = false;
    var removalPolicy: cdk.RemovalPolicy = cdk.RemovalPolicy.RETAIN;

    if (this.nonproduction ?? false )  {
      const autoDeleteObjects = false;
      const removalPolicy = cdk.RemovalPolicy.RETAIN
    } 

    const lifecycleRules = (props.lifecycleRules ?? defaultLifeCycleRules) 

    bucket = new s3.Bucket(this, props.name, {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED, // this is wrong.
      autoDeleteObjects: autoDeleteObjects,
      removalPolicy: removalPolicy,
      lifecycleRules: lifecycleRules,
    })

    if (props.role) {
      new lakeformation.CfnResource(this, `associateBucket${props.name}`, {
        resourceArn: bucket.bucketArn,
        roleArn: props.role.roleArn,
        useServiceLinkedRole: false,
      });
    } else { 
        new lakeformation.CfnResource(this, `associateBucket${props.name}`, {
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
  public addS3IngestDatabase(props: AddS3IngestDatabaseProps): gluedatabase.IngestDataBase {
	
	return new gluedatabase.IngestDataBase(this, props.databaseName, {
		databaseName: props.databaseName,
		bucket: props.bucket,
		bucketSuffix: props.bucketSuffix
	})
  }
}
