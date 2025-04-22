# Video Generation

This API supports generating dynamic videos based on user-provided prompts and images.
This interface submits tasks asynchronously. After the task is submitted, the interface will return the task ID, which can be used to obtain the status of the video generation task and the file ID corresponding to the generated product through the asynchronous task query interface.
After the generation task is completed, you can use the File (Retrieve) interface to download it through the file ID. It should be noted that the valid period of the returned URL is 9 hours (i.e. 32400 seconds) from the beginning of the URL return. After the valid period, the URL will become invalid and the generated information will be lost.

## Intro of APIs

There are two APIs: the task of creating video generation and querying the status of video generation. The steps are as follows:

1. Create a video generation task to get task_id
2. Query the video generation task status based on task_id
3. If the task is generated successfully, you can use the file_id returned by the query interface to view and download the results through the File API.

### Create Video Generation Task

```bash
POST https://api.minimaxi.chat/v1/video_generation
```

We offer support for two distinct video generation patterns: text-to-video and image-to-video. For this app we only use image-to-video.

You can switch between these patterns by adjusting parameters.

#### Request parameters

##### Authorization - string (Required)

API key you got from account setting

##### header - application/json (Required)

Content-type

##### model - string (Required)

ID of model. Options:T2V-01-Director, I2V-01-Director, S2V-01, I2V-01, I2V-01-live, T2V-01

##### prompt - string

Description of the video.
Note: It should be less than 2000 characters.
When the model is selected as T2V-01-Director or I2V-01-Director, it responds more accurately to natural language descriptions and camera movement instructions for shot control.

1. Supports Inserting Instructions for Camera Movement Control.
Camera movement instructions should be inserted in the prompt using the format [ ] . The standard format for camera movement instructions is [C1, C2, C3], where 'C' represents different types of camera movements. A total of 15 enumerated camera movement methods are supported. For details, refer to the section below. (Note: To ensure optimal results, it is recommended to use no more than 3 combined camera movement instructions.)

1.1 Supported 15 Camera Movement Instructions (Enumerated Values)

- Truck: [Truck left], [Truck right]
- Pan: [Pan left], [Pan right]
- Push: [Push in], [Pull out]
- Pedestal: [Pedestal up], [Pedestal down]
- Tilt: [Tilt up], [Tilt down]
- Zoom: [Zoom in], [Zoom out]
- Shake: [Shake]
- Follow: [Tracking shot]
- Static: [Static shot]
  
1.2 Supports Single and Combined Camera Movements

- Single Camera Movement: For example, [Tilt Left] indicates a single camera movement.
- Multiple Simultaneous Movements: Movements within the same group take effect simultaneously. For example, [Tilt Left, Pan Right] indicates two combined movements that take effect at the same time.
- Sequential Movements: Movements inserted earlier in the prompt take effect first. For example, in the prompt description "xxx[Tilt Left], xxx[Pan Right]" , the video will first execute the 'Tilt Left'movement, followed by the 'Pan Right' movement.

1. Supports Natural Language Descriptions for Camera Movement Control.
Using the names of camera movements within instructions will improve the accuracy of the camera movement response.
1. Camera Movement Instructions and Natural Language Descriptions Can Take Effect Simultaneously.

##### prompt_optimizer - boolean

Default value:True. The model will automatically optimize the incoming prompt to improve the generation quality If necessary.
For more precise control, this parameter can be set to
False, and the model will follow the instructions more strictly. At this time
It is recommended to provide finer prompts for best results.

##### first_frame_image - string

The model will use the image passed in this parameter as the first frame to generate a video. It will be required parameter, when the model is selected as I2V-01, I2V-01-Director or I2V-01-live.
Supported formats:

- URL of the image
- base64 encoding of the image

Upon passing this parameter, the model is capable of proceeding without a prompt, autonomously determining the progression of the video.
Image specifications:

- format must be JPG, JPEG, or PNG;
- aspect ratio should be greater than 2:5 and less than 5:2;
- the shorter side must exceed 300 pixels;
- file size must not exceed 20MB.

##### subject_reference - array

This parameter is only available when the model is selected asS2V-01. The model will generate a video based on the subject uploaded through this parameter. Currently, only a single subject reference is supported (array length is 1).

###### subject_reference properties

- type - string

Subject type, currently only"character"is supported, which refers to a human face as the subject.

- image - array

This field accepts either a Base64-encoded string in thedata:image/jpeg;base64,{data}format or a publicly accessible URL, stored as a string in an array (the array length currently supports only 1, i.e., a single reference image).
The reference image must be under 20MB in size, and supported formats include JPG, JPEG, and PNG.
Note: The image must contain valid subject information; otherwise, the video generation process will fail (task creation will not be blocked). In such cases, the query API will return a failure status for the video generation task.

##### callback_url - string（

If you don't need to receive our status update messages in real-time, please don't pass this parameter; you can simply use the Query of Generation Status API.）
When initiating a task creation request, the MiniMax server will send a request with a validation field to the specified request address. When this POST validation request is received, the request address must extract thechallengevalue and return response data containing this value within 3 seconds. If this response is not provided in time, the validation will fail, resulting in a task creation failure.
Sample response data:

```json
{ "challenge": "1a3cs1j-601a-118y-ch52-o48911eabc3u" }
```

After successfully configuring the callback request address, whenever there is a status change in the video generation task, the MiniMax server will send a callback request to this address, containing the latest task status. The structure of the callback request content matches the response body of the API for querying video generation task status (excluding
video_widthandvideo_height).
Task status, including the following status:

- processing - Generating;
- success - The task is successful Success;
- failed - The task failed.

#### Response Parameters

##### task_id - string

The task ID for the asynchronous video generation task is generated, and the results can be retrieved by using this ID in the asynchronous task query interface.

##### base_resp

Status code and its details.

###### base_resp properties

- base_resp.status_code - integer
    - 0, request successful.
    - 1002, trigger rate limit , please contact the sales representative.
    - 1004, account authentication failed. Please check if the API-Key is filled in correctly.
    - 1008, insufficient account balance.
    - 1026, video description involves sensitive content.
    - 2013, the incoming parameter is abnormal, please check whether the imported parameter is filled in as required.
    - 2049, invalid api key.

- base_resp.status_msg - string

Specific error details.

#### Examples

Note: use "T2V-01-Director" for the model.

##### Image to video

```python
import requests
import json
import base64

url = "https://api.minimaxi.chat/v1/video_generation"
api_key = "your api_key"

# base64
with open(f"your_file_path", "rb") as image_file:
    data = base64.b64encode(image_file.read()).decode('utf-8')

payload = json.dumps({
    "model": "T2V-01-Director",
    "prompt": "[Truck left,Pan right]A woman is drinking coffee.",
    "first_frame_image": f"data:image/jpeg;base64,{data}"
})
headers = {
    'authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)

```

##### Call back demo

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import json
app = FastAPI()
@app.post("/get_callback")
async def get_callback(request: Request):
    try:
        json_data = await request.json()
        challenge = json_data.get("challenge")
        if challenge is not None:
          # is a verification request, just return the challenge
          return {"challenge": challenge}
        else:
            # is a callback request, do your own logic here
            # {
            #     "task_id": "115334141465231360",
            #     "status": "Success",
            #     "file_id": "205258526306433",
            #     "base_resp": {
            #         "status_code": 0,
            #         "status_msg": "success"
            #     }
            # }
            return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, # required
        host="0.0.0.0", # Required
        port=8000, # Required, the port can be configured.
        # ssl_keyfile='yourname.yourDomainName.com.key', # Optional, check whether SSL is enabled.
        # ssl_certfile='yourname.yourDomainName.com.key', # Optional, check whether SSL is enabled.
    )
```

##### Example response

```json
{
    "task_id": "106916112212032",
    "base_resp": {
        "status_code": 0,
        "status_msg": "success"
    }
}
```

### Query of Generation Status

```bash
GET https://api.minimaxi.chat/v1/query/video_generation?task_id={task_id}
```

#### Request parameters

##### Authorization - string (Required)

API key you got from account setting

##### task_id - string (Required)

The task ID to be queried. Only tasks created by the current account can be queried.

#### Response parameters

##### task_id - string

The task ID being queried this time.

##### status - string

Task status, including the following status:

- Queueing - In the queque
- Preparing - The task is preparing
- Processing - Generating
- Success - The task is successful Success
- Fail - The task failed

##### file_id - string

After the task status changes to Success, this field returns the file ID corresponding to the generated video

##### base_resp

Status code and its details.

###### base_resp properties

- base_resp.status_code - integer
    - 0, request successful.
    - 1002, trigger rate limit , please contact the sales representative.
    - 1004, account authentication failed. Please check if the API-Key is filled in correctly.
    - 1027, the video generated involved sensitive content

- base_resp.status_msg - string
Status message for the video task.
"success" means the task is successful.

#### Examples

##### Example Request

```python
import requests
import json

api_key="fill in the api_key"
task_id="fill in the task_id"

url = f"http://api.minimaxi.chat/v1/query/video_generation?task_id={task_id}"

payload = {}
headers = {
  'authorization': f'Bearer {api_key}',
  'content-type': 'application/json',
}

response = requests.request("GET", url, headers=headers, data=payload)

print(response.text)
```

##### Example Response

```json
{
    "task_id": "176843862716480",
    "status": "Success",
    "file_id": "176844028768320",
    "base_resp": {
        "status_code": 0,
        "status_msg": "success"
    }
}
```

### Retrieve the download URL of the video file

```bash
POST: https://api.minimaxi.chat/v1/files
```

#### Request parameters

##### Authorization - string (Required)

API key you got from account setting.

##### Content-type - application/json (Required)

Content-type

##### GroupId - string (Required)

Unique identifier for your account.

##### file_id - integer (Required)

Unique Identifier for the file, you got it from the previous step.

#### Response parameters

##### file_id - integer

Unique Identifier for the file.

##### bytes - integer

File size, in bytes.

##### created_at - integer

Unix timestamp when creating the file, in seconds.

##### filename - string

The name of the file.

##### purpose - string

The purpose of using the file.

##### download_url - string

The URL you get to download the video.

##### base_resp

Status code and its details.

- base_resp.status_code - integer
    - 0, success.
    - 1000, unknow erros.
    - 1001, timeout.
    - 1002, trigger rate limit , please contact the sales representative.
    - 1004, account authentication failed. Please check if the API-Key is filled in correctly.
    - 1008, insufficient account balance.
    - 1013, internal service erros.
    - 1026, video description involves sensitive content.
    - 1027, the video generated involves sensitive content.
    - 1039, rate limit of tokens.
    - 2013, the incoming parameter is abnormal, please check whether the imported parameter is filled in as required.

- base_resp.status_msg - string

Status message for the video task.
"success" means the task is successful.

#### Examples

##### Example Request

```python
import requests

group_id = "fill in the groupid"
api_key = "fill in the api key"
file_id = "fill in the file id"

url = f'https://api.minimaxi.chat/v1/files/retrieve?GroupId={group_id}&file_id={file_id}'
headers = {
    'authority': 'api.minimaxi.chat',
    'content-type': 'application/json',
    'Authorization': f'Bearer {api_key}'
}

response = requests.get(url, headers=headers)
print(response.text)
```

##### Example Response

```json
{
    "file": {
        "file_id": ${file_id},
        "bytes": 5896337,
        "created_at": 1700469398,
        "filename": "MiniMaxbot",
        "purpose": "retrieval",
        "download_url": "www.downloadurl.com",
    },
    "base_resp": {
        "status_code": 0,
        "status_msg": "success"
    }
}
```

### Full Example

Here is an example of using the video generation function. The whole process is divided into three steps.

1. Call the video generation interface to submit the generation task.
2. Polling video generation asynchronous task query interface to obtain task status and file ID of the generated video.
3. Call the file download interface to download the generated video by file ID.

```python
import os
import time
import requests
import json

api_key = "Fill in the API Key"

prompt = "Description of your video"
model = "T2V-01" 
output_file_name = "output.mp4" #Please enter the save path for the generated video here

def invoke_video_generation()->str:
    print("-----------------Submit video generation task-----------------")
    url = "https://api.minimaxi.chat/v1/video_generation"
    payload = json.dumps({
      "prompt": prompt,
      "model": model
    })
    headers = {
      'authorization': 'Bearer ' + api_key,
      'content-type': 'application/json',
    }

    response = requests.request("POST", url, headers=headers, data=payload)
    print(response.text)
    task_id = response.json()['task_id']
    print("Video generation task submitted successfully, task ID.："+task_id)
    return task_id

def query_video_generation(task_id: str):
    url = "https://api.minimaxi.chat/v1/query/video_generation?task_id="+task_id
    headers = {
      'authorization': 'Bearer ' + api_key
    }
    response = requests.request("GET", url, headers=headers)
    status = response.json()['status']
    if status == 'Preparing':
        print("...Preparing...")
        return "", 'Preparing'
    elif status == 'Queueing':
        print("...In the queue...")
        return "", 'Queueing'
    elif status == 'Processing':
        print("...Generating...")
        return "", 'Processing'
    elif status == 'Success':
        return response.json()['file_id'], "Finished"
    elif status == 'Fail':
        return "", "Fail"
    else:
        return "", "Unknown"


def fetch_video_result(file_id: str):
    print("---------------Video generated successfully, downloading now---------------")
    url = "https://api.minimaxi.chat/v1/files/retrieve?file_id="+file_id
    headers = {
        'authorization': 'Bearer '+api_key,
    }

    response = requests.request("GET", url, headers=headers)
    print(response.text)

    download_url = response.json()['file']['download_url']
    print("Video download link：" + download_url)
    with open(output_file_name, 'wb') as f:
        f.write(requests.get(download_url).content)
    print("THe video has been downloaded in："+os.getcwd()+'/'+output_file_name)


if __name__ == '__main__':
    task_id = invoke_video_generation()
    print("-----------------Video generation task submitted -----------------")
    while True:
        time.sleep(10)

        file_id, status = query_video_generation(task_id)
        if file_id != "":
            fetch_video_result(file_id)
            print("---------------Successful---------------")
            break
        elif status == "Fail" or status == "Unknown":
            print("---------------Failed---------------")
            break
```
