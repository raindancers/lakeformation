import * as cdk from "aws-cdk-lib";
import { 
	custom_resources as cr,
	aws_iam as iam, 
	aws_s3 as s3,
	aws_sqs as sqs,
} from 'aws-cdk-lib';
import { PropagatedTagSource } from "aws-cdk-lib/aws-ecs";
import { CfnPrincipalPermissions } from "aws-cdk-lib/aws-lakeformation";

import * as constructs from "constructs";
import * as datalake from "../../lakeformation/lakeformation";

export interface s3Path {
	readonly bucket: s3.Bucket;
	readonly path: string;
}

export interface IS3TargetObject {
	ConnectionName?: string;
	DlqEventQueueArn?: string;
	EventQueueArn?: string;
	Exclusions?: string[];
	Path: string;
	SampleSize?: number;
}

export interface S3TargetProps {
  readonly path: s3Path;
  readonly exclusions?: string[];
  readonly connectionName?: string;
  readonly sampleSize?: number;
  /**
   * A queue may have a DLQ
   */ 
  readonly eventQueue?: sqs.Queue,
  readonly dlqEventQueue?: sqs.Queue,
}


export class S3Target extends constructs.Construct {
  
	target: IS3TargetObject
	
	constructor(scope: constructs.Construct, id: string, props: S3TargetProps) {
    super(scope, id);

	this.target = {'Path': `s3://${props.path.bucket.bucketArn}/${props.path.path}}`}

    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Glue.html#createCrawler-property

	//this.target.Path = 
	
	if (props.connectionName){
	  this.target.ConnectionName = props.connectionName
	}

	if (props.eventQueue){
		this.target.EventQueueArn = props.eventQueue.queueArn
	}

	if (props.eventQueue?.deadLetterQueue) {
		this.target.DlqEventQueueArn = props.eventQueue.deadLetterQueue.queue.queueArn
	}

	if (props.exclusions) {
		this.target.Exclusions = props.exclusions
	}

	if (props.sampleSize){
		if (props.sampleSize <= 1 || props.sampleSize > 249) {
			throw new Error("SampleSize for S3 crawler must be between 1 and 249 inclusive");			
		}
		this.target.SampleSize = props.sampleSize
	}  
  }
}
