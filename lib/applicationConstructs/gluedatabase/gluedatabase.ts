import * as cdk from 'aws-cdk-lib';
import {
  aws_s3 as s3,
  aws_lakeformation as lakeformation,
  aws_iam as iam,
  aws_glue as glue,
} from 'aws-cdk-lib';

import * as glue_alpha from '@aws-cdk/aws-glue-alpha';

import * as constructs from 'constructs';
import { createWriteStream } from 'fs';

export interface IngestDataBaseProps {
	databaseName: string,
	bucket: s3.Bucket,
	bucketSuffix: string
}

export interface S3Path {
	bucket: s3.Bucket,
	path: string,
}

export interface S3CrawlerProps {
	name: string,
	description?: string | undefined,
	path?: S3Path,
}

export class IngestDataBase extends constructs.Construct {

  bucket: s3.Bucket
  database: glue_alpha.Database

  constructor(scope: constructs.Construct, id: string, props: IngestDataBaseProps) {
    super(scope, id); 
  
	this.bucket = props.bucket

    this.database = new glue_alpha.Database(this, props.databaseName, {
      databaseName: props.databaseName,
      locationUri: `s3://${props.bucket.bucketName}${props.bucketSuffix}`,
    });
  }

  public addS3Crawler(props: S3CrawlerProps): glue.CfnCrawler {

	// the crawler role will need the service role as well as permission to read the S3 Bucket. 
	const crawlerRole = new iam.Role(this, `crawlerRole${props.name}`, {
		assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
	});
	crawlerRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'));


	if (props.path) {
		props.path.bucket.grantRead(crawlerRole)

	
		return new glue.CfnCrawler(this, `crawler${props.name}`, {
			role: crawlerRole.roleArn,
			databaseName: this.database.databaseName,
			targets: {
				s3Targets: [
					{path: `s3://${props.path.bucket.bucketName}/${props.path.path}`}
				]
			},
			name: props.name,
		})
	
	} else {

		this.bucket.grantRead(crawlerRole)
		return new glue.CfnCrawler(this, `crawler${props.name}`, {
			role: crawlerRole.roleArn,
			databaseName: this.database.databaseName,
			targets: {
				s3Targets: [
					{path: this.database.locationUri}
				]
			},
			name: props.name,
		})
	}

  }
}
