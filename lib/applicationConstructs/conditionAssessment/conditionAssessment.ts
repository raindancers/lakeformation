import * as cdk from "aws-cdk-lib";
import {
  aws_lambda,
  aws_s3 as s3,
  aws_sqs as sqs,
  aws_logs as logs,
  aws_iam as iam,
  aws_events_targets as eventtargets,
} from "aws-cdk-lib";
import * as lakeformation from "../lakeformation/lakeformation";

import * as constructs from "constructs";
import * as path from "path";

export interface ConditionAssessmentProps extends cdk.StackProps {
  credentialsArn: string;
  baseURL: string;
  datalake: lakeformation.LakeFormation;
  targetBucket: s3.Bucket;
  bucketsuffix: string;
}

export class ConditionAssessment extends cdk.Stack {
  dlq: sqs.Queue;
  newassementQueue: sqs.Queue;
  conditionAssementLandingBucket: s3.Bucket;

  constructor(
    scope: constructs.Construct,
    id: string,
    props: ConditionAssessmentProps
  ) {
    super(scope, id, props);

    // this will create a glue database and an ingest crawler
    const ingestdatabase = props.datalake.addS3IngestDatabase({
      databaseName: "conditionassesment",
      bucket: props.targetBucket,
      bucketSuffix: props.bucketsuffix,
    });

    // this will create a crawler that will create a table in the Glue Database.
    ingestdatabase.addS3Crawler({
      name: "GetAssesment",
      description: "Get the CSV Files",
      path: {
        bucket: props.targetBucket,
        path: props.bucketsuffix,
      },
    });

    // Create a Queue for broken jobs
    this.dlq = new sqs.Queue(this, "ConditionAssesmentDLQ");

    this.conditionAssementLandingBucket = props.targetBucket;

    // create the lambda with bundling.
    const conditionAssesmentLambda = new aws_lambda.Function(this, "Function", {
      code: aws_lambda.Code.fromAsset(
        path.join(__dirname, "./lambda"),
        {
          bundling: {
            image: aws_lambda.Runtime.PYTHON_3_9.bundlingImage,
            command: [
              "bash",
              "-c",
              "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output",
            ],
          },
        }
      ),
      runtime: aws_lambda.Runtime.PYTHON_3_9,
      handler: "callAPI.main",
      architecture: aws_lambda.Architecture.ARM_64,
      deadLetterQueue: this.dlq,
      deadLetterQueueEnabled: true,
      environment: {
        BASE_URL: props.baseURL,
        BRONZE_BUCKET: this.conditionAssementLandingBucket.bucketName,
        FOLDER: props.bucketsuffix,
        CREDS_SECRET_ARN: props.credentialsArn,
      },
      logRetention: logs.RetentionDays.TWO_YEARS,
      memorySize: 512,
      retryAttempts: 2,
      timeout: cdk.Duration.seconds(300),
    });

    // allow the lambda's role to have acess to s3 bucket and secret

    this.conditionAssementLandingBucket.grantWrite(conditionAssesmentLambda);

    // allow the lambda's role to have acess to secret
    conditionAssesmentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: [props.credentialsArn],
      })
    );

    //   new events.Rule(this, 'DailySchedule', {
    // 	schedule: Schedule.cron({ hour: '3', minute: '0', }),
    // 	targets: [
    // 		new eventtargets.LambdaFunction(conditionAssesmentLambda, {
    // 			deadLetterQueue: this.dlq,
    // 			maxEventAge: cdk.Duration.hours(2),
    // 			retryAttempts: 2,
    // 		})
    // 	]
    //   })
  }
}
