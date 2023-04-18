import * as cdk from 'aws-cdk-lib';
import {
  aws_s3 as s3,
  aws_lakeformation as lakeformation,
  aws_iam as iam,
  aws_glue as glue,
} from 'aws-cdk-lib';

import * as constructs from 'constructs';
import * as datalake from '../lakeformation/lakeformation'


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
	path: S3Path,
}

export class IngestDataBase extends constructs.Construct {

  bucket: s3.Bucket
  database: glue.CfnDatabase
  databaseName: string

  constructor(scope: constructs.Construct, id: string, props: IngestDataBaseProps) {
    super(scope, id); 
  
	this.bucket = props.bucket
	this.databaseName = props.databaseName

    this.database = new glue.CfnDatabase(this, props.databaseName, {
      catalogId: `${cdk.Aws.ACCOUNT_ID}`,
	  databaseInput: {
		name: props.databaseName,
	  }
    });
  }

  public addS3Crawler(props: S3CrawlerProps): glue.CfnCrawler {

	// the crawler role will need the service role as well as permission to read the S3 Bucket. 
	const crawlerRole = new iam.Role(this, `crawlerRole${props.name}`, {
		assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
	});


	crawlerRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'));

	
	// allow the crawler to access to the glue database and the S3 location. 
	new lakeformation.CfnPermissions(this, 'gluedatabasepermission', {
		dataLakePrincipal: {
			dataLakePrincipalIdentifier: crawlerRole.roleArn
		},
		resource: {
			databaseResource: {
				catalogId: this.database.catalogId,
				name: this.databaseName,
			},
		},
		permissions: [datalake.Permissions.ALL]
	})

	new lakeformation.CfnPermissions(this, 's3permission', {
		dataLakePrincipal: {
			dataLakePrincipalIdentifier: crawlerRole.roleArn
		},
		resource: {
			dataLocationResource: {
				catalogId: this.database.catalogId,
				s3Resource: `${props.path.bucket.bucketArn}/${props.path.path}`

			},
		},
		permissions: [datalake.Permissions.CREATE_TABLE_READ_WRITE]
	})

	
	// create the crawlwer

	return new glue.CfnCrawler(this, `crawler${props.name}`, {
		role: crawlerRole.roleArn,
		databaseName: this.databaseName,
		targets: {
			s3Targets: [
				{path: `s3://${props.path.bucket.bucketName}/${props.path.path}`}
			]
		},
		name: props.name,
	})
	
	
  }
}
