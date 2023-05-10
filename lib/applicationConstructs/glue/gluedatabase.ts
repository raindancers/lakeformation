import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import {
  aws_s3 as s3,
  aws_lakeformation as lakeformation,
  aws_iam as iam,
  aws_glue as glue,
  custom_resources as cr,
  aws_lambda as aws_lambda,
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
	readonly crawlerRole: iam.Role,
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
  
	// allow the crawler to access to the glue database
	new lakeformation.CfnPermissions(this, 'gluedatabasepermission', {
		dataLakePrincipal: {
			dataLakePrincipalIdentifier: props.crawlerRole.roleArn
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
			
			const s3permission = new lakeformation.CfnPermissions(this, `s3permission${index}`, {
				dataLakePrincipal: {
					dataLakePrincipalIdentifier: props.crawlerRole.roleArn
				},
				resource: {
					dataLocationResource: {
						catalogId: this.database.catalogId,
						s3Resource: `${target.s3Arn}` 

					},
				},
				permissions: [datalake.Permissions.CREATE_TABLE_READ_WRITE]
			})
		})
	}


	const dataCrawler = new crawler.Crawler(this, `crawler${props.name}`, {
		name: props.name,
		role: props.crawlerRole,
		databaseName: this.databaseName,
		description: props.description,
		targets: props.targets
	})


	return dataCrawler
  }
}
