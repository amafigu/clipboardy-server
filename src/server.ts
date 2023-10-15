import express from 'express'
import { Server as HttpServer } from 'http'
import WebSocket, { Server as WsServer } from 'ws'
import { PrismaClient, type ClipboardItem } from '@prisma/client'

const prisma = new PrismaClient()
const app = express()
const server = new HttpServer(app)
const wss = new WsServer({ server })

enum MessageType {
  NewTextItem = 'newTextItem',
  Retrieve = 'retrieve',
}

interface NewTextItemMessage {
  type: MessageType.NewTextItem
  text: string
}

interface RetrieveMessage {
  type: MessageType.Retrieve
  id: number
}

type ClientMessage = NewTextItemMessage | RetrieveMessage

async function handleNewTextItem(
  clipboardData: NewTextItemMessage,
): Promise<void> {
  if (!clipboardData.text) return

  const latestItem = await findLatestItem()
  if (latestItem?.text === clipboardData.text) return

  const createdItem = await prisma.clipboardItem.create({
    data: {
      text: clipboardData.text,
    },
  })
  broadcastNewTextItem(createdItem)
}

function formatTextItem(item: ClipboardItem): string {
  return JSON.stringify({
    type: MessageType.NewTextItem,
    text: item.text,
    id: item.id,
  })
}

function broadcastNewTextItem(item: ClipboardItem): void {
  const message = formatTextItem(item)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

async function findLatestItem(): Promise<ClipboardItem | null> {
  const latestItem = await prisma.clipboardItem.findFirst({
    orderBy: { createdAt: 'desc' },
  })
  return latestItem
}

async function handleRetrieve(ws: WebSocket): Promise<void> {
  const latestItem = await findLatestItem()
  if (latestItem == null) return
  ws.send(formatTextItem(latestItem))
}

wss.on('connection', (ws) => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  ws.on('message', async (message: string) => {
    const clipboardData: ClientMessage = JSON.parse(message)
    switch (clipboardData.type) {
      case MessageType.NewTextItem:
        await handleNewTextItem(clipboardData)
        break
      case MessageType.Retrieve:
        await handleRetrieve(ws)
        break
    }
  })
})

const port = process.env.PORT ?? 3000

server.listen(port, () => {
  console.log(`Clipboardy server is listening on port ${port}`)
})
