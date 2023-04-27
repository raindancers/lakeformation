import * as cdk from "aws-cdk-lib";
import {
  custom_resources as cr,
  aws_iam as iam,
  aws_glue as glue,
  aws_secretsmanager as secretsmanager,
} from "aws-cdk-lib";

import * as constructs from "constructs";

export enum ConnectionType {
	JDBC = 'JDBC',
	KAFKA = 'KAFKA',
	MONGODB = 'MONGODB',
	NETWORK	= 'NETWORK',
	MARKETPLACE = 'MARKETPLACE',
	CUSTOM = 'CUSTOM'
}


export interface JDBCProperties {
	host: string,
	port: number,
	url: string,
	secret: secretsmanager.Secret,
	ssl: {
		enforceSSL: boolean,
	}
}


export interface ConnectionProps {
	connectionType: ConnectionType
	jdbcProperties?: 
}

export class Connection extends constructs.Construct {
	
	connection: glue.CfnConnection;





	constructor(scope: constructs.Construct, id: string, props: ConnectionProps) {
	  super(scope, id);

	  this.connection = new glue.CfnConnection(this, "glueconnection", {
		catalogId: cdk.Aws.ACCOUNT_ID,
		connectionInput: {
			connectionType: props.connectionType,
			connectionProperties: 
			descrip[ton]
		}
	  })

	}
}


