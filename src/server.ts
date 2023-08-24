import express from 'express'
import { Server as HttpServer } from 'http'
import WebSocket, { Server as WsServer } from 'ws'
import { PrismaClient, type ClipboardItem } from '@prisma/client'

const prisma = new PrismaClient()
const app = express()
const server = new HttpServer(app)
const wss = new WsServer({ server })

interface ClientNewTextItemMessage {
  type: 'newTextItem'
  text: string
}

interface ClientRetrieveMessage {
  type: 'retrieve'
  id: number
}

type ClientMessage = ClientNewTextItemMessage | ClientRetrieveMessage

interface ServerNewTextItemMessage extends ClientNewTextItemMessage {
  id: number
}

async function handleNewTextItem(
  clipboardData: ClientNewTextItemMessage,
): Promise<void> {
  if (clipboardData.text) {
    const latestItem = await findLatestItem()
    if (latestItem.text === clipboardData.text) {
      return
    }

    const createdItem = await prisma.clipboardItem.create({
      data: {
        text: clipboardData.text,
      },
    })
    broadcastNewTextItem(createdItem)
  }
}

function formatTextItem(item: ClipboardItem): ServerNewTextItemMessage {
  return { type: 'newTextItem', text: item.text, id: item.id }
}

function broadcastNewTextItem(item: ClipboardItem): void {
  const message = JSON.stringify(formatTextItem(item))
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

async function findLatestItem(): Promise<ClipboardItem> {
  const latestItem = await prisma.clipboardItem.findFirstOrThrow({
    orderBy: { createdAt: 'desc' },
  })
  return latestItem
}

async function handleRetrieve(ws: WebSocket): Promise<void> {
  const latestItem = await findLatestItem()
  ws.send(JSON.stringify(formatTextItem(latestItem)))
}

wss.on('connection', (ws) => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  ws.on('message', async (message: string) => {
    const clipboardData: ClientMessage = JSON.parse(message)
    switch (clipboardData.type) {
      case 'newTextItem':
        await handleNewTextItem(clipboardData)
        break
      case 'retrieve':
        await handleRetrieve(ws)
        break
    }
  })
})

const port = process.env.PORT ?? 3000

server.listen(port, () => {
  console.log(`Clipboardy server is listening on port ${port}`)
})
