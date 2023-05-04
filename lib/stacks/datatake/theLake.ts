import * as cdk from 'aws-cdk-lib';
import { 
  aws_s3 as s3, 
  aws_iam as iam
} from 'aws-cdk-lib';
import * as constructs from 'constructs';
import * as lakeformation from '../../applicationConstructs/lakeformation/lakeformation'
import { S3Target } from "../../applicationConstructs/glue/crawler/s3Target";
import { GlueDataBase } from "../../applicationConstructs/glue/gluedatabase";
import { create } from 'domain';



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


    
    this.datalake = new lakeformation.LakeFormation(this, 'LakeFormation', {
      nonproduction: props.nonproduction,
      makeCdkExecRoleLakeAdmin: props.makeCdkExecRoleLakeAdmin,
    })

    // create and add new buckets to the datalake to create Lake Locations
    this.bronze = this.datalake.addNewBucketToLakeFormation({
      name: 'TESTbronze'
    }); 

    this.silver = this.datalake.addNewBucketToLakeFormation({
      name: 'TESTsilver'
    });

    this.gold = this.datalake.addNewBucketToLakeFormation({
      name: 'TESTgold'
    });

    const database = new GlueDataBase(this, 'gluedatabase', {
      databaseName: "worlddata"
    })
    

    // create a Target for the Crawler to use
    const crawlerTarget = new S3Target(this, 's3target', {
      path: {
        bucket: this.bronze,
        path: 'ingest/worldData/',
      },
      //connectionName: 'WorlddataIngest',
    })

    const crawlerRole = new iam.Role(this, 'crawlerRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
    });
  
  
    crawlerRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'));
    crawlerRole.addToPolicy(
      new iam.PolicyStatement({
      actions: [
        //'iam:PassRole',
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
    
    // // crawler.setConfiguration("{\"Version\":1.0,\"CreatePartitionIndex\":true}") // this might be beetter set as an enum.
    

    

  }
}
