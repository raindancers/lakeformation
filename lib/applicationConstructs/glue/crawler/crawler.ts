import * as cdk from "aws-cdk-lib";
import {
  custom_resources as cr,
  aws_iam as iam,
} from "aws-cdk-lib";

import * as constructs from "constructs";

import { GlueClassifier } from "../classifier/classifier";
import { S3Target } from "./s3Target";
import { JDBCTarget } from "./jdbcTarget";

export interface LakeFormationConfiguration {
  AccountId?: string | undefined;
  UseLakeFormationCredentials?: boolean | undefined;
}

export enum CrawlerLineageSettings {
  ENABLE = "ENABLE",
  DISABLE = "DISABLE",
}

export interface LineageConfiguration {
  CrawlerLineageSettings: CrawlerLineageSettings;
}

export enum RecrawlBehavior {
  CRAWL_EVERYTHING = "CRAWL_EVERTHING",
  CRAWL_NEW_FOLDERS_ONLY = "CRAWL_NEW_FOLDERS_ONLY",
  CRAWL_EVENT_MODE = "CRAWL_NEW_FOLDERS_ONLY",
}

export interface RecrawlPolicy {
  RecrawlPolicy: RecrawlBehavior;
}

export enum DeleteBehavior {
  LOG = "LOG",
  DELETE_FROM_DATABASE = "DELETE_FROM_DATABASE",
  DEPRECATE_IN_DATABASE = "DEPRECATE_IN_DATABASE",
}

export enum UpdateBehavior {
  LOG = "LOG",
  UPDATE_IN_DATABASE = "UPDATE_IN_DATABASE",
}

export interface SchemaChangePolicy {
  DeleteBehavior: DeleteBehavior;
  UpdateBehavior: UpdateBehavior;
}

export interface ICrawlerParameters {
  Name: string;
  Role: string;
  s3Targets?: S3Target[] | undefined;
  jdbcTargets?: JDBCTarget[]
  DatabaseName: string;
  Description?: string | undefined;
  Classifiers?: string[] | undefined;
  LakeFormationConfiguration?: LakeFormationConfiguration;
  LineageConfiguration?: LineageConfiguration | undefined;
  RecrawlBehaviour?: RecrawlPolicy | undefined;
  SchemaChangePolicy?: SchemaChangePolicy;
  Configuration?: string | undefined;
  CrawlerSecurityConfiguration?: string | undefined;
  Schedule?: string | undefined;

  TablePrefix?: string | undefined;
}

export interface addClassifiersProps {
  classifiers: GlueClassifier[];
}

export interface CrawlerProps {
  readonly name: string;
  readonly role: iam.Role;
  readonly s3Targets?: S3Target[] | undefined;
  readonly jdbcTargets?: JDBCTarget[]
  readonly databaseName:string;
  readonly description?: string | undefined;
}
//https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Glue.html#createCrawler-property

export class Crawler extends constructs.Construct {
  parameters: {[key:string]: any}

  constructor(scope: constructs.Construct, id: string, props: CrawlerProps) {
    super(scope, id);
    
    // validate that only one of s3Targets has been set. Could not use Type, as this was jsii incompatiable.
    // so this has to be run time check 🔥
    if (props.s3Targets && props.jdbcTargets) {
      throw new Error("Can not have both S3Targets and JdbcTargets")
    }
  
    if (props.s3Targets === undefined && props.jdbcTargets === undefined) {
      throw new Error("Must have at least one target type")
    } 
	
	const targets: {[key:string]: any} = {}

	if (props.s3Targets) {
		const s3targets: object[] = []
		props.s3Targets.forEach((target) => {
			s3targets.push(target.target)
		})	
		targets.S3Targets = s3targets
	}
	if (props.jdbcTargets) {
		const jdbcTargets: object[] = []
		props.jdbcTargets.forEach((target) => {
			jdbcTargets.push(target.target)
		})	
		targets.JdbcTargets = jdbcTargets
	}

	console.log(targets)
	
    // these are the mandatory paramters
    this.parameters = {
      Name: props.name,
      Role: props.role.roleArn,
      Targets: targets,
      DatabaseName: props.databaseName,
    };
    console.log('------')
    console.log(this.parameters)
    

    if (props.description) {
      this.parameters.Description = props.description;
    }

    const crawler = new cr.AwsCustomResource(this, "Crawler", {
      resourceType: "Custom::Crawler",
      onCreate: {
        service: "Glue",
        action: "createCrawler",
        parameters: this.parameters,
        physicalResourceId: cr.PhysicalResourceId.of(`Crawler${props.name}`),
      },
      onUpdate: {
        service: "Glue",
        action: "updateCrawler",
        parameters: this.parameters,
      },
      onDelete: {
        service: "Glue",
        action: "deleteCrawler",
        parameters: {
          Name: props.name,
        },
      },
      
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement(
          { actions: 
            [
              "glue:CreateCrawler",
              "glue:UpdateCrawler",
              "glue:DeleteCrawler",
              "iam:PassRole"
            ],
            resources: ["*"]
          }
        )
      ])
    });

    



  }
  /**
   * This will add classifers to the crawler.
   * @param props addClassifierProps
   */
  public addClassifiers(props: addClassifiersProps): void {
    var classiferNames: string[] = [];
    props.classifiers.forEach((classifier) => {
      classiferNames.push(classifier.name);
    });
    this.parameters.Classifiers = classiferNames;
  }

  public useWithLakeFormation(props: LakeFormationConfiguration): void {
    this.parameters.LakeFormationConfiguration = {
      UseLakeFormationCredentials: props.UseLakeFormationCredentials ?? true,
    };
    if (props.AccountId) {
      this.parameters.LakeFormationConfiguration.AccountId = props.AccountId;
    }
  }

  public setRecrawlBehaviour(recallpolicy: RecrawlPolicy): void {
    this.parameters.RecrawlBehaviour = recallpolicy
  }

  public enableLineage(lineage: CrawlerLineageSettings): void {
	this.parameters.LineageConfiguration = {
		CrawlerLineageSettings: lineage
	}
  }

  public setSchemaChangePolicy(schemaChangePolicy: SchemaChangePolicy): void {
	this.parameters.SchemaChangePolicy = schemaChangePolicy
  }

  public setConfiguration(configuration: string): void {
	this.parameters.Configuration = configuration
  }

  public setCrawlerSecurityConfiguration(configuration: string): void {
	this.parameters.CrawlerSecurityConfiguration = configuration
  }

  public setSchedule(schedule: string): void {
	
	if (checkRegex(new RegExp('^((\*(\/\d+)?|\d+((-|\,)\d+)*)(\s+(\*(\/\d+)?|\d+((-|\,)\d+)*)){4})$'), schedule) == false) {
		throw new Error("The schedule needs to be a valid cron expresson");
	}

	this.parameters.Schedule = schedule
  }


  public setTablePrefix(tablePrefix: string): void {
	this.parameters.TablePrefix = tablePrefix
  }
}

// a function to check if a property is a match for a regex expression
function checkRegex(regex: RegExp, property: string): boolean {
	return regex.test(property)
}