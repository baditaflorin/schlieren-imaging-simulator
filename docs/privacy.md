# Privacy

Live site: https://baditaflorin.github.io/schlieren-imaging-simulator/

## Data Collection

No analytics are shipped in v1.

The app does not collect personal information, create accounts, or send simulation settings to a server.

## Browser Storage

The app stores small local preferences in `localStorage`, including the selected scene and slider values. This data remains in the user's browser.

## Audio

Microphone audio is analyzed locally with Web Audio. Uploaded audio files are played and analyzed locally in the browser. Audio is not uploaded by this app.

## Network Requests

The app fetches same-origin static build metadata from:

https://baditaflorin.github.io/schlieren-imaging-simulator/build-info.json

This is used only to display the published version and build commit on the page.
