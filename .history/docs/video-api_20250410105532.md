# Video Generation

This API supports generating dynamic videos based on user-provided prompts and images.
This interface submits tasks asynchronously. After the task is submitted, the interface will return the task ID, which can be used to obtain the status of the video generation task and the file ID corresponding to the generated product through the asynchronous task query interface.
After the generation task is completed, you can use the File (Retrieve) interface to download it through the file ID. It should be noted that the valid period of the returned URL is 9 hours (i.e. 32400 seconds) from the beginning of the URL return. After the valid period, the URL will become invalid and the generated information will be lost.

## Intro of APIs

There are two APIs: the task of creating video generation and querying the status of video generation. The steps are as follows:

1. Create a video generation task to get task_id
2. Query the video generation task status based on task_id
3. If the task is generated successfully, you can use the file_id returned by the query interface to view and download the results through the File API.
Create Video Generation Task
POST <https://api.minimaxi.chat/v1/video_generation>

We offer support for two distinct video generation patterns: text-to-video and image-to-video. For this app we only use image-to-video.

You can switch between these patterns by adjusting parameters.

### Request parameters

#### Authorization - string (Required)

API key you got from account setting

#### header - application/json (Required)

Content-type

#### model - string (Required)

ID of model. Options:T2V-01-Director, I2V-01-Director, S2V-01, I2V-01, I2V-01-live, T2V-01

#### prompt - string

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

#### prompt_optimizer - boolean

Default value:True. The model will automatically optimize the incoming prompt to improve the generation quality If necessary.
For more precise control, this parameter can be set to
False, and the model will follow the instructions more strictly. At this time
It is recommended to provide finer prompts for best results.

#### first_frame_imagestring
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

#### subject_reference - array

This parameter is only available when the model is selected asS2V-01. The model will generate a video based on the subject uploaded through this parameter. Currently, only a single subject reference is supported (array length is 1).

Show Properties
callback_urlstring（If you don't need to receive our status update messages in real-time, please don't pass this parameter; you can simply use the Query of Generation Status API.）
When initiating a task creation request, the MiniMax server will send a request with a validation field to the specified request address. When this POST validation request is received, the request address must extract thechallengevalue and return response data containing this value within 3 seconds. If this response is not provided in time, the validation will fail, resulting in a task creation failure.
Sample response data:
{ "challenge": "1a3cs1j-601a-118y-ch52-o48911eabc3u" }
After successfully configuring the callback request address, whenever there is a status change in the video generation task, the MiniMax server will send a callback request to this address, containing the latest task status. The structure of the callback request content matches the response body of the API for querying video generation task status (excluding
video_widthandvideo_height).
Task status, including the following status:
-processing - Generating ;
-success - The task is successful Success ;
-failed - The task failed.

## image to video sample

Note: use "I2V-01-Director" for the model.

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
    "model": "I2V-01-Director",
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

## call back demo

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

### example response

```json
{
    "task_id": "106916112212032",
    "base_resp": {
        "status_code": 0,
        "status_msg": "success"
    }
}
```

## query of generation status

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
