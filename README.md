# Local Network Radio

I'm building an application to control and stream audio to a Smart Radio which:

- Supports Frontier Silicon API
- Can receive streaming audio via HTTP Protocol (Called Internet Radio by these devices)

Tested on a Roberts Revival iStream3L but this description likely fits other devices.

## Motivation

My device has Wi-Fi connectivity and supports streaming Spotify, Amazon Music and Deezer via the internet however there was no method that I could find to play my own music library via Wi-Fi. Bluetooth and USB are both options but Bluetooth audio quality can be poor and I wanted to be able to control the playback from other devices as I was accustomed to via Spotify's 'Connect to Device' feature.

## What this application is not

- This is **unsuitable for hosting an internet radio show** as it prioritises low latency over scaling or reliability over the internet. The server is designed to have one client connected and be ran over a local network. See [Icecast](https://icecast.org/) for this purpose.

## State of the project

This project is currently in a proof of concept stage 🚧
