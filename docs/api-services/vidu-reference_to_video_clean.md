# Reference to Video

```http
POST https://api.vidu.com/ent/v2/reference2video
```

## Request Header

| Field         | Value                  | Description                                |
| ------------- | ---------------------- | ------------------------------------------ |
| Content-Type  | application/json       | Data Exchange Format                       |
| Authorization | Token {your_api_key}   | Replace with your API key                  |

## Request Body

| Field               | Type            | Required | Description                                                                                  |
| ------------------- | --------------- | -------- | -------------------------------------------------------------------------------------------- |
| model               | String          | Yes      | Model name. Accepted values: vidu2.0, vidu1.5                                                |
| images              | Array[String]   | Yes      | Reference images.                                                                             |
|                    |                 |          | - Accepts 1 to 3 images                                                                      |
|                    |                 |          | - Must be PNG, JPEG, JPG, or WEBP                                                            |
|                    |                 |          | - Size at least 128x128 pixels                                                               |
|                    |                 |          | - Aspect ratio not less than 1:4 or more than 4:1                                            |
|                    |                 |          | - Max Base64 size: 50MB                                                                      |
| prompt              | String          | Yes      | Text prompt for video generation (max length 1500 characters)                                |
| duration            | Int             | Optional | Duration of output video in seconds. Default is 4.                                           |
|                    |                 |          | - vidu2.0: 4                                                                                 |
|                    |                 |          | - vidu1.5: 4, 8                                                                              |
| seed                | Int             | Optional | Random seed. Override default random behavior                                                |
| aspect_ratio        | String          | Optional | Defaults to 16:9. Accepted values: 16:9, 9:16, 1:1                                            |
| resolution          | String          | Optional | Output resolution. Default is 360p.                                                          |
|                    |                 |          | - vidu1.5 supports: 360p, 720p, 1080p                                                        |
|                    |                 |          | - vidu2.0 supports: 360p, 720p                                                               |
| movement_amplitude  | String          | Optional | Controls movement. Default is auto. Options: auto, small, medium, large                      |
| callback_url        | String          | Optional | Webhook to get task status updates. Returned states: processing, success, failed             |

### Example Request

```bash
curl -X POST   -H "Authorization: Token {your_api_key}"   -H "Content-Type: application/json"   -d '{
    "model": "vidu2.0",
    "images": [
      "https://prod-ss-images.s3.cn-northwest-1.amazonaws.com.cn/vidu-maas/temp/image.png"
    ],
    "prompt": "Santa Claus and the bear hug by the lakeside.",
    "duration": 4,
    "seed": 0,
    "aspect_ratio": "16:9",
    "resolution": "720p",
    "movement_amplitude": "auto"
  }'   https://api.vidu.com/ent/v2/reference2video
```

## Response Body

| Field               | Type          | Description                                          |
| ------------------- | ------------- | ---------------------------------------------------- |
| task_id             | String        | Task ID                                              |
| state               | String        | Task status: created, queueing, processing, success, failed |
| model               | String        | Model used                                           |
| images              | Array[String] | Input images                                         |
| prompt              | String        | Input prompt                                         |
| duration            | Int           | Duration parameter                                   |
| seed                | Int           | Random seed used                                     |
| aspect_ratio        | String        | Aspect ratio used                                    |
| resolution          | String        | Resolution used                                      |
| movement_amplitude  | String        | Camera movement amplitude                            |
| created_at          | String        | Timestamp when task was created                      |

### Example Response

```json
{
  "task_id": "your_task_id_here",
  "state": "created",
  "model": "vidu2.0",
  "images": [
    "https://prod-ss-images.s3.cn-northwest-1.amazonaws.com.cn/vidu-maas/temp/image.png"
  ],
  "prompt": "Santa Claus and the bear hug by the lakeside.",
  "duration": 4,
  "seed": 123456,
  "aspect_ratio": "16:9",
  "resolution": "720p",
  "movement_amplitude": "auto",
  "created_at": "2025-01-01T15:41:31.968916Z"
}
```
