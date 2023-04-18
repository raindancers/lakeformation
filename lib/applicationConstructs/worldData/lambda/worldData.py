import requests
import json
import boto3
import os
import datetime

s3 = boto3.resource('s3')

# variables

url = 'https://restcountries.com/v3.1/all'

def main(event, context):

	response_raw = requests.get(url)

	object = s3.Object(
	    os.environ['BRONZE_BUCKET'],
	    os.environ['FOLDER']
	)

	object.put(Body=bytes(response_raw.text, 'utf-8'))

if __name__ == '__main__':
	main()
