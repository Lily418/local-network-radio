from afsapi import AFSAPI
import asyncio

URL = 'http://192.168.178.26:80/device'
PIN = 1234
TIMEOUT = 1 # in seconds
async def main():
    afsapi = await AFSAPI.create(URL, PIN, TIMEOUT)
    print(f'Power on: {await afsapi.get_power()}')

    print(f'get_volume: {await afsapi.get_volume()}')

    await afsapi.set_volume(15)



loop = asyncio.new_event_loop()
loop.run_until_complete(main())