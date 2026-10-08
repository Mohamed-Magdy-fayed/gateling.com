# Media uploads

Two upload paths, both in `src/integrations/firebase/storage.ts`:

| Path | Procedure | Who | Size cap |
|---|---|---|---|
| Base64 through the server | `uploadImage` | any signed-in user (feedback form, profile, cover images) | 8MB, checked server-side |
| Signed URL, browser PUTs straight to the bucket | `createUploadUrl` | **admins only** (gallery, block editor, content MCP) | images 15MB, video 100MB (`src/lib/upload-limits.ts`) |

## Signed-URL uploads

`createSignedUploadUrl` returns `{ uploadUrl, publicUrl, headers }`. The client
must PUT with exactly `headers`, because every one of them is signed:

- `Content-Type: <contentType>`
- `x-goog-acl: public-read`
- `x-goog-content-length-range: 0,<max bytes>`: Cloud Storage rejects a body
  outside this range. That makes the cap a server-side rule, not only a
  client-side check.

`putFileToSignedUrl` (`src/lib/upload-to-signed-url.ts`) forwards `headers`
verbatim.

## Bucket CORS (applied outside the repo)

The browser PUT is cross-origin, so the bucket must allow the origin, the
`PUT` method and each signed request header. The config is
`firebase-storage-cors.json`. Editing it changes nothing until someone applies it:

```bash
gcloud storage buckets update gs://megz-courses.appspot.com --cors-file=firebase-storage-cors.json
```

(Equivalent: `gsutil cors set firebase-storage-cors.json gs://megz-courses.appspot.com`.)
Check the result with `gcloud storage buckets describe gs://megz-courses.appspot.com --format="default(cors_config)"`.

Apply the CORS change **before** deploying code that sends a new signed
header. Otherwise every gallery and block upload fails the preflight. Re-run
the command after you add an origin, such as a new domain or a Vercel preview URL.
