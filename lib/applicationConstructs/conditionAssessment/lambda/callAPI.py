import requests
import json
from io import StringIO
import boto3
import os
import datetime

# variables
base_url = os.environ['BASE_URL']
login_url = 'System/Login'
work_flow_url = 'Workflow/GetWorkflowList'
credsARN = os.environ['CREDS_SECRET_ARN']

s3 = boto3.resource('s3')

endpoints = [
    {
        "name": "Element Assessment",
        "type": "WorkflowType",
        "fields": [
            "BuildingSite_Assessment",
            "Asset_Type",
            "Building_Name",
            "Year_Built",
            "Floor_Area",
            "Site_Component",
            "Building_Component",
            "Source",
            "Quantum",
            "Quantum_Unit",
            "Age",
            "Remaining_Useful_Life",
            "Condition",
            "Variability",
            "Contract",
            "CA"
        ]
    },
    {
        "name": "Condition Assessment",
        "type": "WorkflowType",
        "fields": [
            "School",
            "Location_Sys",
            "Principal",
            "Office_Email",
            "Office_Phone",
            "Physical_Address",
            "Contract",
            "Org_Contact",
            "Bundle_Deadline",
            "Assign_Lead_Assessor",
            "Lead_Assessor",
            "Planned_Start_Date",
            "Refresh_Condition_Assessment",
            "Assessments",
            "School_ready_for_review",
            "Building_validation_required",
            "Reason",
            "Additional_school_comments",
            "CA_ready_to_submit_to_Ministry",
            "Does_K2_need_to_be_updated",
            "K2_Query_Label",
            "Explanation",
            "Identify_who_is_responsible",
            "K2_Update_Action",
            "Correct_Building_ID",
            "Actions",
            "Details",
            "Assessment_Resolved",
            "Correlation_ID_CA"
        ],
    },
    {
        "name": "Building Component",
        "type": "FormType",
        "fields": [
            "USYS_ActualDateTime",
            "Building_Component"
        ],
    },
    {
        "name": "Contract",
        "type": "FormType",
        "fields": [
            "USYS_ActualDateTime",
            "Company"
        ],
    },
    {
        "name": "Element Assessment OLD",
        "type": "FormType",
        "fields": [
            "BuildingSite_Assessment",
            "USYS_ActualDateTime",
            "Building_Name",
            "Year_Built",
            "Floor_Area",
            "Asset_Type",
            "Site_Component",
            "Building_Component",
            "Element_Site",
            "Element_Building",
            "Source",
            "Quantum_Unit_Site",
            "Unit_Explanation",
            "Quantum",
            "Age",
            "Remaining_Useful_Life",
            "Condition",
            "Variability",
            "Element_Completed"
        ],
    },
    {
        "name": "Building",
        "type": "FormType",
        "fields": [
            "USYS_ActualDateTime",
            "School",
            "K2_Unique_Building_ID",
            "Building_Name"
            "Building_Alternate_Name",
            "Physical_Status",
            "Physical_Status_ID",
            "Is_this_a_relocatable_building",
            "Building_Type",
            "Building_Type_ID",
            "Ownership",
            "Ownership_ID",
            "Year_Built",
            "Floor_Area"
        ],
    },
    {
        "name": "Element Site",
        "type": "FormType",
        "fields": [
            "USYS_ActualDateTime",
            "Condition_Assessment_Type",
            "Site_Component",
            "Element",
            "Material",
            "Quantum_Unit",
            "Life_Expectancy",
            "Unit_Explanations"
        ],
    },
    {
        "name": "Element Building",
        "type": "FormType",
        "fields": [
            "USYS_ActualDateTime",
            "Condition_Assessment_Type",
            "Building_Component",
            "Element",
            "Material",
            "Quantum_Unit",
            "Life_Expectancy",
            "Life_Expectancy"
        ],
    },
    {
        "name": "School Details",
        "type": "FormType",
        "fields": [
            "School_ID",
            "School_Name",
            "School_Type",
            "Location_Sys",
            "Physical_Address",
            "School_GPS",
            "USYS_ActualDateTime",
            "Principal_Name",
            "Principal_Email",
            "Principal_Phone",
            "Office_Email",
            "Office_Phone",
            "Property_Advisor_Name",
            "Property_Advisor_Email",
            "Property_Advisor_Phone",
            "Correlation_ID_Schl"
        ],
    },
    {
        "name": "Site Component'",
        "type": "FormType",
        "fields": [
            "Site_Component",
            "USYS_ActualDateTime"
        ],
    },
    {
        "name": "Assessment",
        "type": "FormType",
        "fields": [
            "USYS_ActualDateTime",
            "School_CA",
            "School",
            "Location_Sys",
            "Asset_Type",
            "Building_Name",
            "Building_Alternate_Name",
            "Building_was_manually_created",
            "Building_ID",
            "Building_Type",
            "Ownership",
            "Floor_Area",
            "Year_Built",
            "Contract"
        ],
    },
]


def get_token(username, password):
    url = base_url+login_url
    payload = f'Username={username}&Password={password}&AuthType=Session'
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    try:
        response_raw = requests.request(
            "POST", url, headers=headers, data=payload
        )
        response = json.loads(response_raw.text)
        token = response.get('Data').get('Token', None)
        return token
    except Exception as e:
        print(e)

# K2 Element Assessment endpoint


def get_data_write_s3(endpoint, token, start_time, end_time):

    if endpoint['type'] == 'WorkflowType':

        url = base_url + 'Workflow/GetWorkflowList'

    elif endpoint['type'] == 'FormType':

        url = base_url + 'Form/GetFormList'

    data = json.dumps(
            {
                'Token': f"{token}",
                f"{endpoint['type']}" : f"{endpoint['name']}",
                'Fields': f"{endpoint['fields']}",
                'SearchCriteria': [f"$AddedDateTime=({start_time}, {end_time})"]
            }
        )

    #try:
    response_raw = requests.request(
        "POST",
        url,
        headers={'Content-Type': 'application/json'},
        data=data
    )

    print(endpoint['name'],':', data)
    # except Exception as e:
    #     print(e)

    object = s3.Object(
        os.environ['BRONZE_BUCKET'],
        f"{os.environ['FOLDER']}/{endpoint['name']}_{start_time}_{end_time}.json"
    )

    object.put(Body=bytes(response_raw.text, 'utf-8'))


def main(event, context):

    try:

        start_time = event['StartTime']
    except:

        yesterday = datetime.date.today() - datetime.timedelta(days=1)
        start_time = yesterday.strftime("%d-%m-%Y %H:%M:%S")

    try:
        end_time = event['EndTime']
    except:
        # end midnight today
        today = datetime.date.today()
        end_time = today.strftime("%d-%m-%Y %H:%M:%S")

    secretsmanager = boto3.client('secretsmanager')

    credentials = json.loads(secretsmanager.get_secret_value(
        SecretId=credsARN)['SecretString'])

    token = get_token(
        username=credentials['UserName'],
        password=credentials['Password']
    )

    for endpoint in endpoints:
        get_data_write_s3(endpoint, token, start_time, end_time)


if __name__ == '__main__':
    main()
