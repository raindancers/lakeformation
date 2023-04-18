# LakeFormation with CDK

This cdk applicaiton creates a Datalake using AWS LakeFormation, and will provide information about the world.  


## Stacks

The applicaiton will create two Stacks.

#### WorldDataLakeFormation. 
This [stack](./lib/stacks/datalake/theLake.ts) creates S3Buckets and add those buckets as Data Lake Locations. 

In this example we are creating three buckets, bronze, gold, which will get used to hold Bronze/Silver/Gold Data teirs of data


#### WorldData
this [stack](./lib/stacks/ingest/worldData/worldData.ts) creates
- A Glue database where tables will be created for data that is ingested
- A Glue Crawler that will crawl a S3 Bucket to create a table in the database, and populate the table with data that is pulled down by a lambda
- A lambda Function that will pull data from restcountries.com which is generic data about world countrys.


## Deployment:
This assumes you have an account in aws, that has been cdk bootstrapped, and access to us it.   This applicaiton is locaiton agnostic. 

TODO: THere is currnetly a gap in this construct, and the cdk-execution role is not given datalake permissions, this will mean that the stack will not deploy, unless you do this manually. Intention is to fix this so it is not a manual requirement. 

Open Lake Formation in Console,  Permissions / Administrative Roles and tasks.. In Data lake administrators add the role

cdk-hnb659fds-cfn-exec-role-<accountnumber>-<region> as a datalake admin.  (if you used a non default cdk qualifier use it instead)


Clone the project, cd into it synth and deploy

```
git clone https://github.com/raindancers/lakeformation.git
cd lakeformation
npm install 
cdk synth
cdk deploy --all --profile <yourprofile>
```

## Usage:

This just sets up the 'infra' for datalake.  To make it useful..

(1) Run the lambda that was created.  You can do this from teh console. It will be called 'WorldData-FunctionXXXXXXX-XXXXX.  Create a Test event, you can just use the hello world default.    

(2) The lambda takes ~2seconds to run.  Check that data got put in the brozne Bucket..  It will be called 'lakestack-lakeformationtestbronzeXXXXXXXX-XXXXx'.  
worldData.json should be in /ingest/worldData/

(3) Open AWS Glue in Console..  and go to crawlers.  There should be a crawler called 'GetWorldData'    Select it, and 'Run Crawler' Let it run, it will probalby take about 60seconds..  

(4) Now look for the worlddata database in 'DataCatalog/Databases'. Select it and view tables.   








