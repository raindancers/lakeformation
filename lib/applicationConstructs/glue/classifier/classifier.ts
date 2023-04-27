import * as cdk from 'aws-cdk-lib';
import {
} from 'aws-cdk-lib';

import * as constructs from 'constructs';

export interface GlueClassifierProps {
	name: string;
}

export class GlueClassifier extends constructs.Construct {

  name: string

  constructor(scope: constructs.Construct, id: string, props: GlueClassifierProps) {
    super(scope, id); 
  
	//this.bucket = props.bucket
	this.name = props.name	
	
  }
}
