import * as cdk from "aws-cdk-lib";
import { custom_resources as cr } from "aws-cdk-lib";

import * as constructs from "constructs";
import * as datalake from "../lakeformation/lakeformation";

export interface CrawlerProps {
  name: string;
  description?: string | undefined;
}

export class Crawler extends constructs.Construct {
  constructor(scope: constructs.Construct, id: string, props: CrawlerProps) {
    super(scope, id);

    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Glue.html#createCrawler-property

    new cr.AwsCustomResource(this, "Crawler", {
      onCreate: {
		service: '',
		action: '', 
		parameters: {
			text: 'thing'
		},
		physicalResourceId: cr.PhysicalResourceId.of('text')
	  },
	  onUpdate: {
		service: '',
		action: '', 
		parameters: {
			text: 'thing'
		}, 
      },
	  onDelete: {
			service: '',
			action: '', 
			parameters: {
				text: 'thing'
			},
	  }, 
	  policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
		resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE
	  })
	})
  }
}
