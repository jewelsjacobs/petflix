# Get Generation

```http
GET https://api.vidu.com/ent/v2/tasks/{id}/creations
```

## Request Header

| Field         | Value                  | Description                                  |
| ------------- | ---------------------- | -------------------------------------------- |
| Content-Type  | application/json       | Data Exchange Format                         |
| Authorization | Token {your_api_key}   | Replace {} with your API key                 |

## Request Body

| Field | Type   | Required | Description                                                                 |
| ----- | ------ | -------- | --------------------------------------------------------------------------- |
| id    | String | Yes      | Task id. The id is returned upon the successful creation of a task by the Start Generating API |

### Example Request

```bash
curl -X GET -H "Authorization: Token {your_api_key}" https://api.vidu.com/ent/v2/tasks/{id}/creations
```

## Response Body

| Field      | Subfield | Type   | Description                                                                 |
| ---------- | -------- | ------ | --------------------------------------------------------------------------- |
| state      |          | String | Returned to a specific processing state:                                    |
|            |          |        | - created: created task successfully                                        |
|            |          |        | - queueing: task in queue                                                   |
|            |          |        | - processing: processing                                                    |
|            |          |        | - success: generation successful                                            |
|            |          |        | - failed: task failed                                                       |
| err_code   |          | String | In case of an error, a specific error code will be returned                |
| creations  |          | Array  | Generated results                                                           |
| id         |          | String | Creation id                                                                 |
| url        |          | String | The URL of the generated results, valid for one hour                        |
| cover_url  |          | String | The cover URL of the generated results, valid for one hour                  |

### Example Response

```json
{
  "state": "success",
  "err_code": "",
  "creations": [
    {
      "id": "your_creations_id",
      "url": "your_generated_results_url",
      "cover_url": "your_generated_results_cover_url"
    }
  ]
}
```
