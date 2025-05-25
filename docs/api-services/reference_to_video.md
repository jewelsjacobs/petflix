# Reference to Video

```http
POST https://api.vidu.com/ent/v2/reference2video
```

## Request Header

| Field         | Value                  | Description                                  |
| ------------- | ---------------------- | -------------------------------------------- |
| Content-Type  | `application/json`     | Data exchange format                         |
| Authorization | `Token {your_api_key}` | Replace `{your_api_key}` with your API key   |

## Request Body

| Field                | Type            | Required | Description|
| -------------------- | --------------- | -------- | ---------- |
| `model`              | String          | Yes      | Model name. Accepted values: `vidu2.0`, `vidu1.5`.|
| `images`             | Array[String]   | Yes      | The model will use the provided images as references to generate a video with consistent subjects. For fields that accept images:
- Accepts 1 to 3 images.
- Images can be provided via URLs or Base64-encoded.
- Supported codecs: PNG, JPEG, JPG, WebP.
- Minimum dimensions: 128×128 pixels.
- Aspect ratio must be between 1:4 and 4:1.
- Maximum size: 50 MB.
- Base64 data must include a content-type prefix, e.g., `image/png;base64,{base64_encode}` |
| `prompt`             | String          | Yes      | A textual description for video generation (max length 1500 characters). |
| `duration`           | Integer         | No       | The length of the output video in seconds. Defaults to `4`. Accepted values: `4`, `8`. (Note: `vidu2.0` currently only supports `4`.) |
| `seed`               | Integer         | No       | Random seed for generation. Defaults to a random value—setting this manually will override the default. |
| `aspect_ratio`       | String          | No       | Aspect ratio of the output video. Defaults to `16:9`. Accepted values: `16:9`, `9:16`, `1:1`. |
| `resolution`         | String          | No       | Resolution of the output video. Defaults to `360p`. Accepted values:
- **vidu1.5**: `360p`, `720p`, `1080p`
- **vidu2.0**: `360p`, `720p` |
| `movement_amplitude` | String          | No       | Movement amplitude of objects in the frame. Defaults to `auto`. Accepted values: `auto`, `small`, `medium`, `large`. |
| `callback_url`       | String          | No       | A URL to receive task status callbacks. After creating the task, Vidu will `POST` the latest status to this URL with the same payload as the GET Generation API. Possible `"state"` values in the callback:
- `processing`: Task is being processed.
- `success`: Generation completed (if delivery fails, retries up to 3×).
- `failed`: Task failed (if delivery fails, retries up to 3×). |

### Example Request

```bash
curl -X POST   -H "Authorization: Token {your_api_key}"   -H "Content-Type: application/json"   -d '{
    "model": "vidu2.0",
    "images": [
      "https://prod-ss-images.s3.cn-northwest-1.amazonaws.com.cn/vidu-maas/temp/your_image_1.png"
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

| Field                | Type            | Description |
| -------------------- | --------------- | ---------------------------- |
| `task_id`            | String          | Unique ID for the task.                                                                                                                              |
| `state`              | String          | Task status:
- `created` (task created)
- `queuing` (in queue)
- `processing` (in progress)
- `success` (completed)
- `failed` (error) |
| `model`              | String          | Model used for the call.                                                                                                                             |
| `images`             | Array[String]   | The image URLs used for the call.                                                                                                                    |
| `prompt`             | String          | The text prompt used for the call.                                                                                                                   |
| `duration`           | Integer         | Video duration parameter used for the call.                                                                                                          |
| `seed`               | Integer         | Random seed parameter used for the call.                                                                                                             |
| `aspect_ratio`       | String          | Aspect ratio parameter used for the call.                                                                                                            |
| `resolution`         | String          | Resolution parameter used for the call.                                                                                                              |
| `movement_amplitude` | String          | Camera movement amplitude parameter used for the call.                                                                                               |
| `created_at`         | String          | Timestamp when the task was created (ISO 8601).                                                                                                      |

### Example Response

```json
{
  "task_id": "your_task_id_here",
  "state": "created",
  "model": "vidu2.0",
  "images": [
    "https://prod-ss-images.s3.cn-northwest-1.amazonaws.com.cn/vidu-maas/temp/your_image_1.png"
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
