import asyncio
import logging
from websockets.server import serve

async def echo(websocket):
    async for message in websocket:
        if message == "schedules":
            logging.info(f"{websocket.remote_address} requested schedules")
            await websocket.send("schedules")

async def main():
    logging.basicConfig(level=logging.INFO)
    async with serve(echo, "localhost", 8001):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())