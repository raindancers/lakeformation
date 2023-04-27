import * as cdk from 'aws-cdk-lib';
import {
  aws_s3 as s3,
  aws_lakeformation as lakeformation,
  aws_iam as iam,
  aws_glue as glue,
} from 'aws-cdk-lib';

import * as constructs from 'constructs';
import * as datalake from '../lakeformation/lakeformation'
import * as crawler from '../glue/crawler/crawler'


export interface DataBaseProps {
	readonly databaseName: string,
}

export interface S3Path {
	readonly bucket: s3.Bucket,
	readonly path: string,
}

export interface CrawlerProps {
	readonly name: string,
	readonly description?: string | undefined,
	readonly targets: crawler.Targets,
}

export class GlueDataBase extends constructs.Construct {

  database: glue.CfnDatabase
  databaseName: string

  constructor(scope: constructs.Construct, id: string, props: DataBaseProps) {
    super(scope, id); 
  
	//this.bucket = props.bucket
	this.databaseName = props.databaseName

    this.database = new glue.CfnDatabase(this, props.databaseName, {
      catalogId: `${cdk.Aws.ACCOUNT_ID}`,
	  databaseInput: {
		name: props.databaseName,
	  }
    });
  }

  public addCrawler(props: CrawlerProps): crawler.Crawler {

	// the crawler role will need the service role as well as permission to read the S3 Bucket. 
	const crawlerRole = new iam.Role(this, `crawlerRole${props.name}`, {
		assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
	});


	crawlerRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'));
	crawlerRole.addToPolicy(
	  new iam.PolicyStatement({
		actions: ['lakeformation:GetDataAccess'],
		effect: iam.Effect.ALLOW,
		resources: ['*']
	  })	
	)

	// allow the crawler to access to the glue database
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

	// if targets includes s3targets give permissions to them.

	if (props.targets.s3Targets) {
		props.targets.s3Targets.forEach((target, index) => { 
			
			new lakeformation.CfnPermissions(this, `s3permission${index}`, {
				dataLakePrincipal: {
					dataLakePrincipalIdentifier: crawlerRole.roleArn
				},
				resource: {
					dataLocationResource: {
						catalogId: this.database.catalogId,
						s3Resource: `${target.target.Path}`

					},
				},
				permissions: [datalake.Permissions.CREATE_TABLE_READ_WRITE]
			})
		})
	};



	// new lakeformation.CfnPermissions(this, 's3permission', {
	// 	dataLakePrincipal: {
	// 		dataLakePrincipalIdentifier: crawlerRole.roleArn
	// 	},
	// 	resource: {
	// 		dataLocationResource: {
	// 			catalogId: this.database.catalogId,
	// 			s3Resource: `${props.path.bucket.bucketArn}/${props.path.path}`

	// 		},
	// 	},
	// 	permissions: [datalake.Permissions.CREATE_TABLE_READ_WRITE]
	// })

	
	// create the crawlwer

	return new crawler.Crawler(this, `crawler${props.name}`, {
		name: props.name,
		role: crawlerRole,
		databaseName: this.databaseName,
		description: props.description,
		targets: props.targets
	})


	// return new glue.CfnCrawler(this, `crawler${props.name}`, {
	// 	role: crawlerRole.roleArn,
	// 	databaseName: this.databaseName,
	// 	targets: {
	// 		s3Targets: [
	// 			{path: `s3://${props.path.bucket.bucketName}/${props.path.path}`}
	// 		]
	// 	},
	// 	name: props.name,
	// })
	
	
  }
}
