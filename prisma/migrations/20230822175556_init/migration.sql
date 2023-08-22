-- CreateTable
CREATE TABLE "ClipboardItem" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClipboardItem_pkey" PRIMARY KEY ("id")
);
