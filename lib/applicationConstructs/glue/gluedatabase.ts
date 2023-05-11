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
import { S3Target } from "../glue/crawler/s3Target";
import { JDBCTarget } from "../glue/crawler/jdbcTarget";





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
	readonly s3targets?: S3Target[],
	readonly jdbcTargets?: JDBCTarget[],
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

	// validate that the props provided are valid
	if (props.s3targets && props.jdbcTargets) {
		throw new Error("Cannot have both s3Targets and jdbcTargets")
	};

	if (props.s3targets === undefined && props.jdbcTargets === undefined) {
		throw new Error("Must have one of s3Targets or jdbcTargets")
	};
  

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

	
	if (props.s3targets) {

		props.s3targets.forEach((target, index) => {
			
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
		s3Targets: props.s3targets,
		jdbcTargets: props.jdbcTargets,
	})
	
	return dataCrawler
  }
}
