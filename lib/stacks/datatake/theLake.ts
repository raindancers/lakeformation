import * as cdk from 'aws-cdk-lib';
import * as path from 'path'
import { 
  aws_s3 as s3, 
  aws_iam as iam,
} from 'aws-cdk-lib';
import * as constructs from 'constructs';
import * as lakeformation from '../../applicationConstructs/lakeformation/lakeformation'
import { S3Target } from "../../applicationConstructs/glue/crawler/s3Target";
import { GlueDataBase } from "../../applicationConstructs/glue/gluedatabase";
import { Delay } from '../../applicationConstructs/delay/delay';


export interface LakeStackProps extends cdk.StackProps {
  makeCdkExecRoleLakeAdmin?: boolean | undefined
  nonproduction?: boolean | undefined
}


export class WorldDataLakeFormation extends cdk.Stack {

  datalake: lakeformation.LakeFormation;
  bronze: s3.Bucket;
  silver: s3.Bucket;
  gold: s3.Bucket;

  constructor(scope: constructs.Construct, id: string, props: LakeStackProps) {
    super(scope, id, props);

    // this code add is general lakeformation setup. 
    
    this.datalake = new lakeformation.LakeFormation(this, 'LakeFormation', {
      nonproduction: props.nonproduction,
      makeCdkExecRoleLakeAdmin: props.makeCdkExecRoleLakeAdmin,
    })

    // create and add new buckets to the datalake to create Lake Locations
    this.bronze = this.datalake.addNewBucketToLakeFormation({
      name: 'bronze'
    }); 

    this.silver = this.datalake.addNewBucketToLakeFormation({
      name: 'silver'
    });

    this.gold = this.datalake.addNewBucketToLakeFormation({
      name: 'gold'
    });
  

    const waitforassn = new cdk.CustomResource(this, `delayresource`, {
      serviceToken: new Delay(this, 'delay').delayProviderServiceToken,
      properties: {
        SleepTime: 60,
      },
    })
    
    // adding datalake locations is an async operation, so we can not
    // rely on cloudformation to tell us that the resoruce is actually built
    // start a delay, after all the locatitons claim they are finished.

    waitforassn.node.addDependency(this.bronze)
    waitforassn.node.addDependency(this.silver)
    waitforassn.node.addDependency(this.gold)
    


    // the below code is specific for an ingest

    const database = new GlueDataBase(this, 'gluedatabase', {
      databaseName: "worlddata"
    })
    // wait untill the delay is done before creating the database
    database.node.addDependency(waitforassn)
    

    // create a Target for the Crawler to use
    const crawlerTarget = new S3Target(this, 's3target', {
      path: {
        bucket: this.bronze,
        path: 'ingest/worldData/',
      },
    })

    // create a role for this crawler to use. 
    const crawlerRole = new iam.Role(this, 'crawlerRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
    });
  
    // add additonal permissions as required. 
    crawlerRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'));
    crawlerRole.addToPolicy(
      new iam.PolicyStatement({
      actions: [
        'lakeformation:GetDataAccess',
      ],
      effect: iam.Effect.ALLOW,
      resources: ['*']
      })	
    )

    //this will create a crawler that will create a table in the Glue Database.
    const crawler = database.addCrawler({
      name: "CrawlWorldData",
      crawlerRole: crawlerRole,
      description: "Get World Data",
      targets: {
        s3Targets: [
          crawlerTarget,
        ],
      }
    });

    crawler.useWithLakeFormation(
      {
        AccountId: cdk.Aws.ACCOUNT_ID,
        UseLakeFormationCredentials: true  
      }
    )    
    crawler.setConfiguration("{\"Version\":1.0,\"CreatePartitionIndex\":true}") // this might be beetter set as an enum.
    crawler.node.addDependency(waitforassn)
  }
}
