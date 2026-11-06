# Putting the Cloud Temple and Church on Render

The `site` folder holds the finished website. `render.yaml` tells Render how to serve it.
On Render the site has no chat: visitors walk, sit, read, listen, light incense and float wishes on their own.

## 1. Put the files on GitHub
1. Create a new, empty repository on GitHub, for example `cloud-temple`.
2. Add `site`, `render.yaml` and this file to it. The website upload page only takes 100 files at a time and `site` has about 300, so use GitHub Desktop (drag the folder in and press Publish), or several uploads.

## 2. Create the site on Render
1. In Render, choose New, then Blueprint, and pick the repository.
2. Render reads `render.yaml` and creates a static site called `cloud-temple`. Its address will be like `https://cloud-temple.onrender.com` (Render adds letters if the name is taken).
3. To use your own domain later, add it under the site's Settings, Custom Domains.

## 3. Updating
After any change in `public`, run `python3 scripts/build-site.py` and upload the new `site` folder.

## Costs to watch
Every visit downloads the 3D page, and music when played. On Render's free plan the monthly download allowance is small, so check the usage page in your first weeks.
