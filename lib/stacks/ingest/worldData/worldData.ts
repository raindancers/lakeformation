import * as cdk from "aws-cdk-lib";
import {
  aws_lambda,
  aws_s3 as s3,
  aws_logs as logs, 
  aws_iam as iam,
} from "aws-cdk-lib";

import * as constructs from "constructs";
import * as path from "path";

export interface WorldDataProps extends cdk.StackProps {

  targetBucket: s3.Bucket;
  bucketsuffix: string;
}

export class WorldData extends cdk.Stack {
  
  constructor(scope: constructs.Construct, id: string, props: WorldDataProps){
    super(scope, id, props);

   

    // create the lambda with bundling.
    const getWorldDataFn = new aws_lambda.Function(this, "Function", {
      code: aws_lambda.Code.fromAsset(
        path.join(__dirname, "./lambda"),
        {
          // requests requires bundling 
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
      handler: "worldData.main",
	  // lambdas run cheaper on ARM, than intel, and just as well. 
      architecture: aws_lambda.Architecture.ARM_64,
      deadLetterQueueEnabled: true,
      environment: {
        BRONZE_BUCKET:props.targetBucket.bucketName,
        FOLDER: props.bucketsuffix,
      },
      logRetention: logs.RetentionDays.TWO_YEARS,
      memorySize: 512,
      retryAttempts: 2,
      timeout: cdk.Duration.seconds(300),
    });

    // allow the lambda's role to have acess to s3 bucket and secret

    props.targetBucket.grantWrite(getWorldDataFn);


  }
}
